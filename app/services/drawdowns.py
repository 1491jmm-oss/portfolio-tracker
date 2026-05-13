from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class DrawdownSeriesPoint:
    fecha: date
    valor: float


@dataclass(frozen=True)
class DrawdownPoint:
    fecha: date
    valor_portfolio: float
    running_peak: float
    drawdown_pct: float
    drawdown_abs: float


@dataclass(frozen=True)
class DrawdownSummary:
    max_drawdown_pct: float
    max_drawdown_abs: float
    fecha_peak: date | None
    fecha_trough: date | None


@dataclass(frozen=True)
class DrawdownResult:
    series: list[DrawdownPoint]
    summary: DrawdownSummary


def calculate_drawdowns(series: list[DrawdownSeriesPoint]) -> DrawdownResult:
    sorted_series = sorted(series, key=lambda point: point.fecha)
    if not sorted_series:
        return DrawdownResult(
            series=[],
            summary=DrawdownSummary(
                max_drawdown_pct=0.0,
                max_drawdown_abs=0.0,
                fecha_peak=None,
                fecha_trough=None,
            ),
        )

    running_peak = sorted_series[0].valor
    running_peak_date = sorted_series[0].fecha
    max_drawdown_pct = 0.0
    max_drawdown_abs = 0.0
    max_drawdown_peak_date = running_peak_date
    max_drawdown_trough_date = running_peak_date
    drawdowns: list[DrawdownPoint] = []

    for point in sorted_series:
        if point.valor > running_peak:
            running_peak = point.valor
            running_peak_date = point.fecha

        drawdown_abs = point.valor - running_peak
        drawdown_pct = 0.0 if running_peak <= 0 else drawdown_abs / running_peak

        if drawdown_pct < max_drawdown_pct:
            max_drawdown_pct = drawdown_pct
            max_drawdown_abs = drawdown_abs
            max_drawdown_peak_date = running_peak_date
            max_drawdown_trough_date = point.fecha

        drawdowns.append(
            DrawdownPoint(
                fecha=point.fecha,
                valor_portfolio=point.valor,
                running_peak=running_peak,
                drawdown_pct=drawdown_pct,
                drawdown_abs=drawdown_abs,
            )
        )

    return DrawdownResult(
        series=drawdowns,
        summary=DrawdownSummary(
            max_drawdown_pct=max_drawdown_pct,
            max_drawdown_abs=max_drawdown_abs,
            fecha_peak=max_drawdown_peak_date,
            fecha_trough=max_drawdown_trough_date,
        ),
    )
