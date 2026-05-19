import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import (
    analytics,
    assets,
    benchmarks,
    fx_rates,
    movements,
    positions,
    prices,
    snapshots,
    valuations,
)
from app.routes.iol import router as iol_router
from app.services.scheduler import start_scheduler, stop_scheduler


logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Portfolio Tracker API",
    description="API local para seguimiento simple de activos, movimientos, posiciones y valuacion.",
    version="0.9.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(movements.router)
app.include_router(positions.router)
app.include_router(prices.router)
app.include_router(fx_rates.router)
app.include_router(valuations.router)
app.include_router(snapshots.router)
app.include_router(benchmarks.router)
app.include_router(analytics.router)
app.include_router(iol_router)


@app.on_event("startup")
def startup_event() -> None:
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event() -> None:
    stop_scheduler()


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
    