from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Asset, AssetType, Movement, MovementType, PositionUnit
from app.schemas import PositionRead


router = APIRouter(prefix="/positions", tags=["positions"])

QUANTITY_ASSET_TYPES = {AssetType.ACCION, AssetType.CEDEAR}
BOND_ASSET_TYPES = {
    AssetType.BONO_SOBERANO,
    AssetType.LETRA,
    AssetType.BONO_TASA_FIJA,
    AssetType.BONO_CER,
    AssetType.BONO_DOLAR_LINKED,
    AssetType.ON,
}


def signed_position_delta(movement: Movement, unit: PositionUnit) -> float:
    if unit == PositionUnit.CANTIDAD:
        value = movement.cantidad or 0
    elif unit == PositionUnit.NOMINAL:
        value = movement.nominal or 0
    else:
        value = movement.cash_flow or 0

    movement_type = MovementType(movement.tipo_movimiento)
    if movement_type == MovementType.VENTA:
        return -value
    if movement_type == MovementType.AMORTIZACION:
        return -value if unit == PositionUnit.NOMINAL else 0
    if movement_type in {MovementType.CUPON, MovementType.DIVIDENDO}:
        return 0
    return value


def unit_for_asset(asset_type: AssetType) -> PositionUnit:
    if asset_type in QUANTITY_ASSET_TYPES:
        return PositionUnit.CANTIDAD
    if asset_type in BOND_ASSET_TYPES:
        return PositionUnit.NOMINAL
    return PositionUnit.SALDO


@router.get("", response_model=list[PositionRead])
def list_positions(db: Session = Depends(get_db)) -> list[PositionRead]:
    assets = list(db.scalars(select(Asset).order_by(Asset.ticker)).all())
    movements_by_ticker: dict[str, list[Movement]] = {}

    movements = db.scalars(select(Movement).order_by(Movement.fecha, Movement.id)).all()
    for movement in movements:
        movements_by_ticker.setdefault(movement.ticker, []).append(movement)

    positions: list[PositionRead] = []
    for asset in assets:
        asset_type = AssetType(asset.tipo)
        unit = unit_for_asset(asset_type)
        current_value = sum(
            signed_position_delta(movement, unit)
            for movement in movements_by_ticker.get(asset.ticker, [])
        )

        positions.append(
            PositionRead(
                ticker=asset.ticker,
                tipo=asset_type,
                cantidad_actual=current_value if unit == PositionUnit.CANTIDAD else None,
                nominal_actual=current_value if unit == PositionUnit.NOMINAL else None,
                unidad=unit,
            )
        )

    return positions
