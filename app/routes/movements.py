from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Asset, AssetType, Movement, MovementType
from app.schemas import MovementCreate, MovementRead


router = APIRouter(prefix="/movements", tags=["movements"])

QUANTITY_ASSET_TYPES = {AssetType.ACCION, AssetType.CEDEAR}
BOND_ASSET_TYPES = {
    AssetType.BONO_SOBERANO,
    AssetType.LETRA,
    AssetType.BONO_TASA_FIJA,
    AssetType.BONO_CER,
    AssetType.BONO_DOLAR_LINKED,
    AssetType.ON,
}
POSITION_AFFECTING_MOVEMENTS = {
    MovementType.COMPRA,
    MovementType.VENTA,
    MovementType.AMORTIZACION,
    MovementType.TRANSFERENCIA,
    MovementType.AJUSTE,
}


def validate_movement_against_asset(movement: MovementCreate, asset: Asset) -> None:
    asset_type = AssetType(asset.tipo)
    movement_type = movement.tipo_movimiento

    if asset_type == AssetType.LIQUIDEZ:
        if movement.cash_flow is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="LIQUIDEZ requiere cash_flow para calcular saldo",
            )
        if movement.cantidad is not None or movement.nominal is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="LIQUIDEZ no usa cantidad ni nominal",
            )
        return

    if (
        movement.cash_flow is not None
        and movement_type in POSITION_AFFECTING_MOVEMENTS
        and movement_type != MovementType.AMORTIZACION
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="cash_flow solo se admite en ingresos cobrados y LIQUIDEZ",
        )

    if asset_type in QUANTITY_ASSET_TYPES:
        if movement.nominal is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Acciones y CEDEAR usan cantidad, no nominal",
            )
        if movement_type in POSITION_AFFECTING_MOVEMENTS and movement.cantidad is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{movement_type} requiere cantidad para {asset_type}",
            )
        if movement_type == MovementType.AMORTIZACION:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="AMORTIZACION solo aplica a activos que usan nominal",
            )

    if asset_type in BOND_ASSET_TYPES:
        if movement.cantidad is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Bonos, letras y ON usan nominal, no cantidad",
            )
        if movement_type in POSITION_AFFECTING_MOVEMENTS and movement.nominal is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{movement_type} requiere nominal para {asset_type}",
            )
        if movement_type == MovementType.DIVIDENDO:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="DIVIDENDO no aplica a activos que usan nominal",
            )


@router.post("", response_model=MovementRead, status_code=status.HTTP_201_CREATED)
def create_movement(movement_in: MovementCreate, db: Session = Depends(get_db)) -> Movement:
    asset = db.scalar(select(Asset).where(Asset.ticker == movement_in.ticker))
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el activo {movement_in.ticker}",
        )

    validate_movement_against_asset(movement_in, asset)

    movement = Movement(**movement_in.model_dump())
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@router.get("", response_model=list[MovementRead])
def list_movements(db: Session = Depends(get_db)) -> list[Movement]:
    statement = select(Movement).order_by(Movement.fecha, Movement.id)
    return list(db.scalars(statement).all())


@router.delete("/{movement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movement(movement_id: int, db: Session = Depends(get_db)) -> None:
    movement = db.get(Movement, movement_id)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el movimiento {movement_id}",
        )

    db.delete(movement)
    db.commit()
