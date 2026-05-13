from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PortfolioSnapshot, PortfolioSnapshotItem
from app.schemas import PortfolioSnapshotItemRead, PortfolioSnapshotRead, normalize_ticker
from app.services.snapshots import generate_portfolio_snapshot


router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.get("", response_model=list[PortfolioSnapshotRead])
def list_snapshots(db: Session = Depends(get_db)) -> list[PortfolioSnapshot]:
    statement = select(PortfolioSnapshot).order_by(PortfolioSnapshot.fecha.asc())
    return list(db.scalars(statement).all())


@router.get("/items", response_model=list[PortfolioSnapshotItemRead])
def list_snapshot_items(
    ticker: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    db: Session = Depends(get_db),
) -> list[PortfolioSnapshotItem]:
    statement = select(PortfolioSnapshotItem)

    if ticker is not None:
        statement = statement.where(PortfolioSnapshotItem.ticker == normalize_ticker(ticker))
    if fecha_desde is not None:
        statement = statement.where(PortfolioSnapshotItem.fecha >= fecha_desde)
    if fecha_hasta is not None:
        statement = statement.where(PortfolioSnapshotItem.fecha <= fecha_hasta)

    statement = statement.order_by(
        PortfolioSnapshotItem.fecha.asc(),
        PortfolioSnapshotItem.ticker.asc(),
    )
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
