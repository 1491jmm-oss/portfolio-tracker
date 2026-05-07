from dataclasses import dataclass

from fastapi import HTTPException, status

from app.models import Asset, AssetType, Currency, Movement, MovementType, PositionUnit
from app.routes.positions import signed_position_delta, unit_for_asset
from app.services.cost_basis import movement_units


INCOME_MOVEMENT_TYPES = {
    MovementType.CUPON,
    MovementType.DIVIDENDO,
    MovementType.AMORTIZACION,
}


@dataclass
class IncomeCashFlow:
    amount: float
    currency: Currency


def calculated_cashflow_amount(
    asset_type: AssetType,
    movement: Movement,
    unit: PositionUnit,
    current_units: float,
) -> float:
    if movement.cash_flow is not None:
        return movement.cash_flow

    movement_type = MovementType(movement.tipo_movimiento)
    movement_unit_amount = movement_units(movement, unit)

    if movement_type == MovementType.AMORTIZACION and unit == PositionUnit.NOMINAL:
        if movement.precio is None:
            return movement_unit_amount
        return (movement.precio / 100) * movement_unit_amount

    units = movement_unit_amount or current_units
    if movement.precio is not None and units > 0:
        if asset_type in {AssetType.ACCION, AssetType.CEDEAR}:
            return units * movement.precio
        return (movement.precio / 100) * units

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            f"No se puede calcular cash_flow para {movement.tipo_movimiento} "
            f"de {movement.ticker}: cargar cash_flow o precio con cantidad/nominal"
        ),
    )


def collect_income_cashflows(asset: Asset, movements: list[Movement]) -> list[IncomeCashFlow]:
    asset_type = AssetType(asset.tipo)
    unit = unit_for_asset(asset_type)

    if unit == PositionUnit.SALDO:
        return []

    current_units = 0.0
    cashflows: list[IncomeCashFlow] = []

    for movement in sorted(movements, key=lambda item: (item.fecha, item.id)):
        movement_type = MovementType(movement.tipo_movimiento)

        if movement_type in INCOME_MOVEMENT_TYPES:
            amount = calculated_cashflow_amount(asset_type, movement, unit, current_units)
            cashflows.append(
                IncomeCashFlow(amount=amount, currency=Currency(movement.moneda))
            )

        current_units += signed_position_delta(movement, unit)
        if abs(current_units) < 1e-12:
            current_units = 0.0

    return cashflows
