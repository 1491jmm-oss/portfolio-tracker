import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.services.snapshots import generate_portfolio_snapshot


logger = logging.getLogger(__name__)

SCHEDULER_TIMEZONE = ZoneInfo("America/Buenos_Aires")
SNAPSHOT_JOB_ID = "daily_portfolio_snapshot"

scheduler = BackgroundScheduler(timezone=SCHEDULER_TIMEZONE)


def create_today_snapshot_job() -> None:
    today = datetime.now(SCHEDULER_TIMEZONE).date()
    db = SessionLocal()
    try:
        generate_portfolio_snapshot(today, db)
    except Exception:
        logger.exception("Error generando snapshot automatico para fecha=%s", today)
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        create_today_snapshot_job,
        CronTrigger(hour=23, minute=55, timezone=SCHEDULER_TIMEZONE),
        id=SNAPSHOT_JOB_ID,
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler iniciado: snapshot diario configurado a las 23:55")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido")
