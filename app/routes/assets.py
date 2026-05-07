from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Asset
from app.schemas import AssetCreate, AssetRead, normalize_ticker


router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create_asset(asset_in: AssetCreate, db: Session = Depends(get_db)) -> Asset:
    existing_asset = db.scalar(select(Asset).where(Asset.ticker == asset_in.ticker))
    if existing_asset:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un activo con ticker {asset_in.ticker}",
        )

    asset = Asset(**asset_in.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("", response_model=list[AssetRead])
def list_assets(db: Session = Depends(get_db)) -> list[Asset]:
    return list(db.scalars(select(Asset).order_by(Asset.ticker)).all())


@router.get("/{ticker}", response_model=AssetRead)
def get_asset(ticker: str, db: Session = Depends(get_db)) -> Asset:
    normalized_ticker = normalize_ticker(ticker)
    asset = db.scalar(select(Asset).where(Asset.ticker == normalized_ticker))
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el activo {normalized_ticker}",
        )
    return asset
