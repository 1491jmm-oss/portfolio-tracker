from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PortfolioSnapshot
from app.schemas import PortfolioSnapshotRead
from app.services.snapshots import generate_portfolio_snapshot


router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.get("", response_model=list[PortfolioSnapshotRead])
def list_snapshots(db: Session = Depends(get_db)) -> list[PortfolioSnapshot]:
    statement = select(PortfolioSnapshot).order_by(PortfolioSnapshot.fecha.asc())
    return list(db.scalars(statement).all())


@router.post(
    "/create",
    response_model=PortfolioSnapshotRead,
    status_code=status.HTTP_201_CREATED,
)
def create_snapshot(
    fecha: date = Query(..., description="Fecha del snapshot en formato YYYY-MM-DD"),
    db: Session = Depends(get_db),
) -> PortfolioSnapshot:
    return generate_portfolio_snapshot(fecha, db)
