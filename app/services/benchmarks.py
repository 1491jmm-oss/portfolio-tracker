from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class BenchmarkSeriesPoint:
    fecha: date
    valor: float


@dataclass(frozen=True)
class NormalizedBenchmarkPoint:
    fecha: date
    valor_original: float
    valor_normalizado: float


def normalize_series_base_100(
    series: list[BenchmarkSeriesPoint],
) -> list[NormalizedBenchmarkPoint]:
    sorted_series = sorted(series, key=lambda point: point.fecha)
    if not sorted_series:
        return []

    base_value = sorted_series[0].valor
    if base_value <= 0:
        raise ValueError("La serie no puede normalizarse: el primer valor debe ser mayor a 0")

    normalized: list[NormalizedBenchmarkPoint] = []
    for point in sorted_series:
        normalized.append(
            NormalizedBenchmarkPoint(
                fecha=point.fecha,
                valor_original=point.valor,
                valor_normalizado=(point.valor / base_value) * 100,
            )
        )

    return normalized
