from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FxRate
from app.schemas import FxRateCreate, FxRateRead


router = APIRouter(prefix="/fx-rates", tags=["fx-rates"])


@router.post("", response_model=FxRateRead, status_code=status.HTTP_201_CREATED)
def create_fx_rate(fx_rate_in: FxRateCreate, db: Session = Depends(get_db)) -> FxRate:
    fx_rate = FxRate(**fx_rate_in.model_dump())
    db.add(fx_rate)
    db.commit()
    db.refresh(fx_rate)
    return fx_rate


@router.get("", response_model=list[FxRateRead])
def list_fx_rates(db: Session = Depends(get_db)) -> list[FxRate]:
    statement = select(FxRate).order_by(FxRate.fecha, FxRate.tipo, FxRate.id)
    return list(db.scalars(statement).all())
