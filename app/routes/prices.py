from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Asset, Price
from app.schemas import PriceCreate, PriceRead


router = APIRouter(prefix="/prices", tags=["prices"])


@router.post("", response_model=PriceRead, status_code=status.HTTP_201_CREATED)
def create_price(price_in: PriceCreate, db: Session = Depends(get_db)) -> Price:
    asset = db.scalar(select(Asset).where(Asset.ticker == price_in.ticker))
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe el activo {price_in.ticker}",
        )

    price = Price(**price_in.model_dump())
    db.add(price)
    db.commit()
    db.refresh(price)
    return price


@router.get("", response_model=list[PriceRead])
def list_prices(db: Session = Depends(get_db)) -> list[Price]:
    statement = select(Price).order_by(Price.fecha, Price.ticker, Price.id)
    return list(db.scalars(statement).all())
