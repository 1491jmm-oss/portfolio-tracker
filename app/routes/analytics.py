from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Currency, PortfolioSnapshot
from app.schemas import DrawdownResponse, DrawdownSummaryRead
from app.services.drawdowns import DrawdownSeriesPoint, calculate_drawdowns


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/drawdowns", response_model=DrawdownResponse)
def get_drawdowns(
    moneda: Currency = Query(...),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DrawdownResponse:
    statement = select(PortfolioSnapshot)

    if fecha_desde is not None:
        statement = statement.where(PortfolioSnapshot.fecha >= fecha_desde)
    if fecha_hasta is not None:
        statement = statement.where(PortfolioSnapshot.fecha <= fecha_hasta)

    snapshots = list(db.scalars(statement.order_by(PortfolioSnapshot.fecha.asc())).all())
    values = [
        DrawdownSeriesPoint(
            fecha=snapshot.fecha,
            valor=snapshot.total_ars if moneda == Currency.ARS else snapshot.total_usd,
        )
        for snapshot in snapshots
    ]
    result = calculate_drawdowns(values)

    return DrawdownResponse(
        moneda=moneda,
        series=result.series,
        summary=DrawdownSummaryRead(
            max_drawdown_pct=result.summary.max_drawdown_pct,
            max_drawdown_abs=result.summary.max_drawdown_abs,
            fecha_peak=result.summary.fecha_peak,
            fecha_trough=result.summary.fecha_trough,
        ),
    )
