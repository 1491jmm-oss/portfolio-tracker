import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PortfolioSnapshot
from app.routes.valuations import get_valuations


logger = logging.getLogger(__name__)


def generate_portfolio_snapshot(fecha: date, db: Session) -> PortfolioSnapshot:
    existing_snapshot = db.scalar(
        select(PortfolioSnapshot).where(PortfolioSnapshot.fecha == fecha)
    )
    if existing_snapshot:
        logger.info("Snapshot ya existente para fecha=%s", fecha)
        return existing_snapshot

    valuation = get_valuations(fecha=fecha, db=db)
    snapshot = PortfolioSnapshot(
        fecha=fecha,
        total_ars=valuation.total_ars,
        total_usd=valuation.total_usd,
        total_costo_ars=valuation.total_costo_ars,
        total_costo_usd=valuation.total_costo_usd,
        total_pnl_ars=valuation.total_pnl_ars,
        total_pnl_usd=valuation.total_pnl_usd,
        total_return_ars=valuation.total_return_ars,
        total_return_usd=valuation.total_return_usd,
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    logger.info("Snapshot creado para fecha=%s id=%s", fecha, snapshot.id)
    return snapshot
