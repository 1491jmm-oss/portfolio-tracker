from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BenchmarkPrice, BenchmarkType
from app.schemas import BenchmarkPerformanceRead, BenchmarkPriceRead, BenchmarkRead
from app.services.benchmarks import BenchmarkSeriesPoint, normalize_series_base_100


router = APIRouter(prefix="/benchmarks", tags=["benchmarks"])


@router.get("", response_model=list[BenchmarkRead])
def list_benchmarks() -> list[BenchmarkRead]:
    return [BenchmarkRead(benchmark=benchmark) for benchmark in BenchmarkType]


@router.get("/prices", response_model=list[BenchmarkPriceRead])
def list_benchmark_prices(
    benchmark: BenchmarkType | None = Query(default=None),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[BenchmarkPrice]:
    statement = select(BenchmarkPrice)

    if benchmark is not None:
        statement = statement.where(BenchmarkPrice.benchmark == benchmark)
    if fecha_desde is not None:
        statement = statement.where(BenchmarkPrice.fecha >= fecha_desde)
    if fecha_hasta is not None:
        statement = statement.where(BenchmarkPrice.fecha <= fecha_hasta)

    statement = statement.order_by(BenchmarkPrice.fecha.asc(), BenchmarkPrice.benchmark.asc())
    return list(db.scalars(statement).all())


@router.get("/performance", response_model=list[BenchmarkPerformanceRead])
def get_benchmark_performance(
    benchmark: BenchmarkType = Query(...),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[BenchmarkPerformanceRead]:
    prices = list_benchmark_prices(
        benchmark=benchmark,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        db=db,
    )
    series = [
        BenchmarkSeriesPoint(fecha=price.fecha, valor=price.valor)
        for price in prices
    ]

    try:
        normalized = normalize_series_base_100(series)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    return [
        BenchmarkPerformanceRead(
            fecha=point.fecha,
            valor_original=point.valor_original,
            valor_normalizado=point.valor_normalizado,
        )
        for point in normalized
    ]
