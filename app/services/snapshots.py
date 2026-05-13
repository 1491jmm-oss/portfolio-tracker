import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PortfolioSnapshot, PortfolioSnapshotItem
from app.routes.valuations import get_valuations
from app.schemas import ValuationResponse


logger = logging.getLogger(__name__)


def create_snapshot_items(
    snapshot: PortfolioSnapshot,
    valuation: ValuationResponse,
    db: Session,
) -> int:
    existing_tickers = set(
        db.scalars(
            select(PortfolioSnapshotItem.ticker).where(
                PortfolioSnapshotItem.snapshot_id == snapshot.id
            )
        ).all()
    )
    created_count = 0

    for item in valuation.valuations:
        if item.ticker in existing_tickers:
            continue

        weight = 0.0 if valuation.total_ars == 0 else item.valor_ars / valuation.total_ars
        db.add(
            PortfolioSnapshotItem(
                snapshot_id=snapshot.id,
                fecha=valuation.fecha,
                ticker=item.ticker,
                tipo=item.tipo,
                valor_ars=item.valor_ars,
                valor_usd=item.valor_usd,
                costo_ars=item.costo_total_ars,
                costo_usd=item.costo_total_usd,
                pnl_ars=item.pnl_ars,
                pnl_usd=item.pnl_usd,
                total_return_ars=item.total_return_ars,
                total_return_usd=item.total_return_usd,
                cantidad_actual=item.cantidad_actual,
                nominal_actual=item.nominal_actual,
                peso_portfolio_pct=weight,
            )
        )
        created_count += 1

    return created_count


def generate_portfolio_snapshot(fecha: date, db: Session) -> PortfolioSnapshot:
    existing_snapshot = db.scalar(
        select(PortfolioSnapshot).where(PortfolioSnapshot.fecha == fecha)
    )
    if existing_snapshot:
        valuation = get_valuations(fecha=fecha, db=db)
        created_count = create_snapshot_items(existing_snapshot, valuation, db)
        if created_count:
            db.commit()
            logger.info(
                "Snapshot existente completado con %s items nuevos para fecha=%s",
                created_count,
                fecha,
            )

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
    db.flush()
    created_count = create_snapshot_items(snapshot, valuation, db)
    db.commit()
    db.refresh(snapshot)
    logger.info(
        "Snapshot creado para fecha=%s id=%s items=%s",
        fecha,
        snapshot.id,
        created_count,
    )
    return snapshot
