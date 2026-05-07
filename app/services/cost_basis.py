from dataclasses import dataclass

from fastapi import HTTPException, status

from app.models import Asset, AssetType, Currency, Movement, MovementType, PositionUnit
from app.routes.positions import signed_position_delta, unit_for_asset


@dataclass
class CostBasis:
    ppc: float
    costo_total: float
    moneda_costo: Currency | None
    comisiones_venta: float


def movement_units(movement: Movement, unit: PositionUnit) -> float:
    if unit == PositionUnit.CANTIDAD:
        return movement.cantidad or 0
    if unit == PositionUnit.NOMINAL:
        return movement.nominal or 0
    return movement.cash_flow or 0


def movement_cost(asset_type: AssetType, movement: Movement, units: float) -> float:
    if movement.precio is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Falta precio de compra para calcular PPC de {movement.ticker}",
        )

    if asset_type in {AssetType.ACCION, AssetType.CEDEAR}:
        return units * movement.precio + movement.comision

    return (movement.precio / 100) * units + movement.comision


def ensure_cost_currency(
    ticker: str,
    current_currency: Currency | None,
    movement_currency: Currency,
) -> Currency:
    if current_currency is None:
        return movement_currency

    if current_currency != movement_currency:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"No se puede calcular PPC de {ticker} con compras en monedas mixtas "
                f"({current_currency} y {movement_currency})"
            ),
        )

    return current_currency


def calculate_cost_basis(asset: Asset, movements: list[Movement]) -> CostBasis:
    asset_type = AssetType(asset.tipo)
    unit = unit_for_asset(asset_type)

    if unit == PositionUnit.SALDO:
        balance = sum(signed_position_delta(movement, unit) for movement in movements)
        return CostBasis(
            ppc=1.0 if balance else 0.0,
            costo_total=balance,
            moneda_costo=Currency(asset.moneda_origen),
            comisiones_venta=0.0,
        )

    current_units = 0.0
    accumulated_cost = 0.0
    cost_currency: Currency | None = None
    sale_commissions = 0.0

    for movement in sorted(movements, key=lambda item: (item.fecha, item.id)):
        movement_type = MovementType(movement.tipo_movimiento)
        units = movement_units(movement, unit)
        movement_currency = Currency(movement.moneda)

        if movement_type == MovementType.COMPRA:
            cost_currency = ensure_cost_currency(asset.ticker, cost_currency, movement_currency)
            accumulated_cost += movement_cost(asset_type, movement, units)
            current_units += units
            continue

        if movement_type == MovementType.VENTA:
            if movement.comision > 0 and cost_currency is not None:
                ensure_cost_currency(asset.ticker, cost_currency, movement_currency)
            sale_commissions += movement.comision
            if current_units > 0 and units > 0:
                reduction_ratio = min(units / current_units, 1)
                accumulated_cost -= accumulated_cost * reduction_ratio
            current_units -= units
            if abs(current_units) < 1e-12:
                current_units = 0.0
                accumulated_cost = 0.0
            continue

        if movement_type == MovementType.AMORTIZACION and unit == PositionUnit.NOMINAL:
            if current_units > 0 and units > 0:
                reduction_ratio = min(units / current_units, 1)
                accumulated_cost -= accumulated_cost * reduction_ratio
            current_units -= units
            if abs(current_units) < 1e-12:
                current_units = 0.0
                accumulated_cost = 0.0

    if current_units == 0:
        return CostBasis(
            ppc=0.0,
            costo_total=0.0,
            moneda_costo=cost_currency,
            comisiones_venta=sale_commissions,
        )

    return CostBasis(
        ppc=accumulated_cost / current_units,
        costo_total=accumulated_cost,
        moneda_costo=cost_currency,
        comisiones_venta=sale_commissions,
    )
