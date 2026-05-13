"use client";

import { AlertCircle, ShieldAlert } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { filterByRange, type TimeRange } from "@/lib/chart-controls";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, DrawdownPoint, DrawdownResponse } from "@/services/api";

interface DrawdownChartProps {
  drawdowns: DrawdownResponse | null;
  isLoading: boolean;
  error: string | null;
  currency: Currency;
  timeRange: TimeRange;
}

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function summaryForRange(series: DrawdownPoint[]) {
  if (series.length === 0) {
    return {
      max_drawdown_pct: 0,
      max_drawdown_abs: 0,
      fecha_peak: null as string | null,
      fecha_trough: null as string | null,
    };
  }

  let maxDrawdown = series[0];
  for (const point of series) {
    if (point.drawdown_pct < maxDrawdown.drawdown_pct) {
      maxDrawdown = point;
    }
  }

  const peakPoint = [...series]
    .filter((point) => point.fecha <= maxDrawdown.fecha && point.running_peak === maxDrawdown.running_peak)
    .at(-1);

  return {
    max_drawdown_pct: maxDrawdown.drawdown_pct,
    max_drawdown_abs: maxDrawdown.drawdown_abs,
    fecha_peak: peakPoint?.fecha ?? null,
    fecha_trough: maxDrawdown.fecha,
  };
}

function DrawdownTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: DrawdownPoint }>;
  label?: string;
  currency: Currency;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;

  return (
    <div className="min-w-56 rounded-md border border-border bg-[#101722] p-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">Fecha: {label}</div>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <span>Drawdown</span>
          <span className="font-mono text-red-300">{formatPercent(datum.drawdown_pct)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Drawdown abs</span>
          <span className="font-mono text-red-300">{formatMoney(datum.drawdown_abs, currency)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Peak value</span>
          <span className="font-mono text-foreground">
            {formatMoney(datum.running_peak, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DrawdownChart({
  drawdowns,
  isLoading,
  error,
  currency,
  timeRange,
}: DrawdownChartProps) {
  const series = drawdowns ? filterByRange(drawdowns.series, timeRange) : [];
  const summary = summaryForRange(series);
  const hasEnoughData = series.length >= 2;

  return (
    <Card className="border-white/10 bg-card/85 backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Drawdown analytics</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Underwater chart de riesgo histórico en {currency}
            </p>
          </div>
          <ShieldAlert className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </div>
        {!isLoading && !error && hasEnoughData ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/35 p-3">
              <p className="text-xs uppercase text-muted-foreground">Max Drawdown %</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-red-300">
                {formatPercent(summary.max_drawdown_pct)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Peak {summary.fecha_peak ?? "-"} · Trough {summary.fecha_trough ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/35 p-3">
              <p className="text-xs uppercase text-muted-foreground">Max Drawdown {currency}</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-red-300">
                {formatMoney(summary.max_drawdown_abs, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Basado en snapshots históricos</p>
            </div>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-md border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="flex max-w-md items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div>
                <p className="font-medium">No se pudo cargar drawdowns</p>
                <p className="mt-1 text-sm text-red-100/70">{error}</p>
              </div>
            </div>
          </div>
        ) : !hasEnoughData ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Se necesitan al menos dos snapshots para calcular drawdowns.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
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
                domain={["auto", 0]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) => formatPercent(Number(value))}
                width={64}
              />
              <Tooltip
                content={<DrawdownTooltip currency={currency} />}
                cursor={{ stroke: "rgba(148,163,184,0.25)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="drawdown_pct"
                stroke="#f87171"
                fill="#f87171"
                fillOpacity={0.22}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
