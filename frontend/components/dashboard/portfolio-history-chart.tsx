"use client";

import { useMemo } from "react";
import { AlertCircle, History } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useBenchmarkPerformance } from "@/hooks/use-benchmark-performance";
import {
  chartModes,
  currencies,
  filterByRange,
  scaleModes,
  timeRanges,
  type ChartMode,
  type ScaleMode,
  type TimeRange,
} from "@/lib/chart-controls";
import { formatCompactMoney, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Benchmark, BenchmarkPerformancePoint, Currency, Snapshot } from "@/services/api";

interface PortfolioHistoryChartProps {
  snapshots: Snapshot[];
  isLoading: boolean;
  error: string | null;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  scaleMode: ScaleMode;
  onScaleModeChange: (scaleMode: ScaleMode) => void;
  chartMode: ChartMode;
  onChartModeChange: (chartMode: ChartMode) => void;
}

interface ChartDatum {
  fecha: string;
  portfolioValue?: number;
  costBasis?: number;
  portfolioNormalized?: number;
  benchmarkNormalized?: number;
}

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function benchmarkForCurrency(currency: Currency): Benchmark {
  return currency === "ARS" ? "CER" : "SPY";
}

function normalizeValue(value: number, base: number) {
  return base > 0 ? (value / base) * 100 : null;
}

function AbsoluteTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey?: string; payload: ChartDatum }>;
  label?: string;
  currency: Currency;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;
  const portfolioValue = datum.portfolioValue ?? 0;
  const costBasis = datum.costBasis ?? 0;
  const difference = portfolioValue - costBasis;
  const differencePct = costBasis === 0 ? null : difference / costBasis;

  return (
    <div className="min-w-56 rounded-md border border-border bg-[#101722] p-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">Fecha: {label}</div>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <span>Portfolio value</span>
          <span className="font-mono text-foreground">{formatMoney(portfolioValue, currency)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Cost basis</span>
          <span className="font-mono text-foreground">{formatMoney(costBasis, currency)}</span>
        </div>
        <div className="flex justify-between gap-6 border-t border-border pt-1.5">
          <span>Diferencia</span>
          <span className={cn("font-mono", difference >= 0 ? "text-emerald-300" : "text-red-300")}>
            {formatMoney(difference, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Diferencia %</span>
          <span className={cn("font-mono", difference >= 0 ? "text-emerald-300" : "text-red-300")}>
            {formatPercent(differencePct)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RelativeTooltip({
  active,
  payload,
  label,
  benchmark,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey?: string; payload: ChartDatum }>;
  label?: string;
  benchmark: Benchmark;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;
  const portfolio = datum.portfolioNormalized ?? null;
  const benchmarkValue = datum.benchmarkNormalized ?? null;
  const difference =
    portfolio !== null && benchmarkValue !== null ? portfolio - benchmarkValue : null;

  return (
    <div className="min-w-64 rounded-md border border-border bg-[#101722] p-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">Fecha: {label}</div>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <span>Portfolio performance</span>
          <span className="font-mono text-foreground">
            {portfolio === null ? "-" : formatNumber(portfolio, 2)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span>{benchmark} performance</span>
          <span className="font-mono text-foreground">
            {benchmarkValue === null ? "-" : formatNumber(benchmarkValue, 2)}
          </span>
        </div>
        <div className="flex justify-between gap-6 border-t border-border pt-1.5">
          <span>Diferencia relativa</span>
          <span
            className={cn(
              "font-mono",
              difference === null
                ? "text-muted-foreground"
                : difference >= 0
                  ? "text-emerald-300"
                  : "text-red-300",
            )}
          >
            {difference === null ? "-" : `${formatNumber(difference, 2)} pts`}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PortfolioHistoryChart({
  snapshots,
  isLoading,
  error,
  currency,
  onCurrencyChange,
  timeRange,
  onTimeRangeChange,
  scaleMode,
  onScaleModeChange,
  chartMode,
  onChartModeChange,
}: PortfolioHistoryChartProps) {
  const benchmark = benchmarkForCurrency(currency);
  const {
    data: benchmarkPerformance,
    error: benchmarkError,
    isLoading: benchmarkLoading,
  } = useBenchmarkPerformance(benchmark);

  const filteredSnapshots = useMemo(
    () => filterByRange(snapshots, timeRange),
    [snapshots, timeRange],
  );
  const filteredBenchmark = useMemo(
    () => filterByRange(benchmarkPerformance, timeRange),
    [benchmarkPerformance, timeRange],
  );

  const data = useMemo<ChartDatum[]>(() => {
    if (chartMode === "absolute") {
      return filteredSnapshots.map((snapshot) => ({
        fecha: snapshot.fecha,
        portfolioValue: currency === "ARS" ? snapshot.total_ars : snapshot.total_usd,
        costBasis: currency === "ARS" ? snapshot.total_costo_ars : snapshot.total_costo_usd,
      }));
    }

    const portfolioBaseSnapshot = filteredSnapshots.find((snapshot) => {
      const value = currency === "ARS" ? snapshot.total_ars : snapshot.total_usd;
      return value > 0;
    });
    const benchmarkBasePoint = filteredBenchmark.find((point) => point.valor_original > 0);
    const portfolioBase = portfolioBaseSnapshot
      ? currency === "ARS"
        ? portfolioBaseSnapshot.total_ars
        : portfolioBaseSnapshot.total_usd
      : 0;
    const benchmarkBase = benchmarkBasePoint?.valor_original ?? 0;
    const rows = new Map<string, ChartDatum>();

    for (const snapshot of filteredSnapshots) {
      const value = currency === "ARS" ? snapshot.total_ars : snapshot.total_usd;
      rows.set(snapshot.fecha, {
        ...(rows.get(snapshot.fecha) ?? { fecha: snapshot.fecha }),
        portfolioNormalized: normalizeValue(value, portfolioBase) ?? undefined,
      });
    }

    for (const point of filteredBenchmark) {
      rows.set(point.fecha, {
        ...(rows.get(point.fecha) ?? { fecha: point.fecha }),
        benchmarkNormalized: normalizeValue(point.valor_original, benchmarkBase) ?? undefined,
      });
    }

    return Array.from(rows.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [benchmark, chartMode, currency, filteredBenchmark, filteredSnapshots]);

  const valuesForScale = data.flatMap((item) => {
    if (chartMode === "absolute") {
      return [item.portfolioValue, item.costBasis];
    }
    return [item.portfolioNormalized, item.benchmarkNormalized];
  });
  const canUseLogScale = valuesForScale.every((value) => value === undefined || value > 0);
  const effectiveScale: ScaleMode = scaleMode === "log" && canUseLogScale ? "log" : "linear";
  const isLogFallback = scaleMode === "log" && !canUseLogScale;
  const chartLoading = isLoading || (chartMode === "relative" && benchmarkLoading);
  const chartError = error ?? (chartMode === "relative" ? benchmarkError : null);

  return (
    <Card className="border-white/10 bg-card/85 backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Evolución histórica</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {chartMode === "absolute"
                ? "Portfolio value contra costo invertido"
                : `Performance base 100 vs ${benchmark}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              items={chartModes}
              value={chartMode}
              onChange={onChartModeChange}
              labels={{ absolute: "Absolute", relative: "Relative" }}
            />
            <ToggleGroup items={currencies} value={currency} onChange={onCurrencyChange} />
            <ToggleGroup items={timeRanges} value={timeRange} onChange={onTimeRangeChange} />
            <ToggleGroup
              items={scaleModes}
              value={scaleMode}
              onChange={onScaleModeChange}
              labels={{ linear: "Linear", log: "Log" }}
            />
            <History className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </div>
        </div>
        {isLogFallback ? (
          <p className="text-xs text-amber-200/80">
            Log requiere valores positivos. Se muestra escala linear para este rango.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="h-[360px]">
        {chartLoading ? (
          <Skeleton className="h-full w-full" />
        ) : chartError ? (
          <div className="flex h-full items-center justify-center rounded-md border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="flex max-w-md items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div>
                <p className="font-medium">No se pudo cargar el histórico</p>
                <p className="mt-1 text-sm text-red-100/70">{chartError}</p>
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Todavía no hay datos para este rango.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha"
                minTickGap={24}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={formatDateLabel}
              />
              <YAxis
                scale={effectiveScale}
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) =>
                  chartMode === "absolute"
                    ? formatCompactMoney(Number(value), currency)
                    : formatNumber(Number(value), 0)
                }
                width={72}
              />
              <Tooltip
                content={
                  chartMode === "absolute" ? (
                    <AbsoluteTooltip currency={currency} />
                  ) : (
                    <RelativeTooltip benchmark={benchmark} />
                  )
                }
                cursor={{ stroke: "rgba(148,163,184,0.25)", strokeWidth: 1 }}
              />
              {chartMode === "absolute" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="portfolioValue"
                    name="Portfolio Value"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={data.length <= 10}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="costBasis"
                    name="Cost Basis"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={data.length <= 10}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="portfolioNormalized"
                    name="Portfolio base 100"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={data.length <= 10}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmarkNormalized"
                    name={`${benchmark} base 100`}
                    stroke="#a3e635"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={data.length <= 10}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
