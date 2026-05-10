"use client";

import { useMemo, useState } from "react";
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
import { formatCompactMoney, formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, Snapshot } from "@/services/api";

interface PortfolioHistoryChartProps {
  snapshots: Snapshot[];
  isLoading: boolean;
  error: string | null;
}

type TimeRange = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
type ScaleMode = "linear" | "log";

interface ChartDatum {
  fecha: string;
  portfolioValue: number;
  costBasis: number;
}

const timeRanges: TimeRange[] = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];
const currencies: Currency[] = ["ARS", "USD"];
const scaleModes: ScaleMode[] = ["linear", "log"];

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function subtractMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() - months);
  return next;
}

function startDateForRange(range: TimeRange, latestDate: Date) {
  if (range === "ALL") {
    return null;
  }

  if (range === "YTD") {
    return new Date(latestDate.getFullYear(), 0, 1);
  }

  if (range === "1Y") {
    return subtractMonths(latestDate, 12);
  }

  const months = Number(range.replace("M", ""));
  return subtractMonths(latestDate, months);
}

function filterSnapshots(snapshots: Snapshot[], range: TimeRange) {
  const sorted = [...snapshots].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const latest = sorted.at(-1);
  if (!latest) {
    return [];
  }

  const startDate = startDateForRange(range, parseDate(latest.fecha));
  if (!startDate) {
    return sorted;
  }

  return sorted.filter((snapshot) => parseDate(snapshot.fecha) >= startDate);
}

function ToggleGroup<T extends string>({
  items,
  value,
  onChange,
  labels,
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/60 p-0.5">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "h-7 rounded-sm px-2.5 text-xs font-medium text-muted-foreground transition-colors",
            value === item && "bg-primary text-primary-foreground shadow-sm",
          )}
        >
          {labels?.[item] ?? item}
        </button>
      ))}
    </div>
  );
}

function HistoryTooltip({
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
  const difference = datum.portfolioValue - datum.costBasis;
  const differencePct = datum.costBasis === 0 ? null : difference / datum.costBasis;

  return (
    <div className="min-w-56 rounded-md border border-border bg-[#101722] p-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">Fecha: {label}</div>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <span>Portfolio value</span>
          <span className="font-mono text-foreground">
            {formatMoney(datum.portfolioValue, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Cost basis</span>
          <span className="font-mono text-foreground">{formatMoney(datum.costBasis, currency)}</span>
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

export function PortfolioHistoryChart({
  snapshots,
  isLoading,
  error,
}: PortfolioHistoryChartProps) {
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("linear");

  const data = useMemo<ChartDatum[]>(() => {
    return filterSnapshots(snapshots, timeRange).map((snapshot) => ({
      fecha: snapshot.fecha,
      portfolioValue: currency === "ARS" ? snapshot.total_ars : snapshot.total_usd,
      costBasis: currency === "ARS" ? snapshot.total_costo_ars : snapshot.total_costo_usd,
    }));
  }, [currency, snapshots, timeRange]);

  const canUseLogScale = data.every(
    (item) => item.portfolioValue > 0 && item.costBasis > 0,
  );
  const effectiveScale: ScaleMode = scaleMode === "log" && canUseLogScale ? "log" : "linear";
  const isLogFallback = scaleMode === "log" && !canUseLogScale;

  return (
    <Card className="border-white/10 bg-card/85 backdrop-blur">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Evolución histórica</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Portfolio value contra costo invertido
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup items={currencies} value={currency} onChange={setCurrency} />
            <ToggleGroup items={timeRanges} value={timeRange} onChange={setTimeRange} />
            <ToggleGroup
              items={scaleModes}
              value={scaleMode}
              onChange={setScaleMode}
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
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-md border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="flex max-w-md items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div>
                <p className="font-medium">No se pudo cargar el histórico</p>
                <p className="mt-1 text-sm text-red-100/70">{error}</p>
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Todavía no hay snapshots para este rango.
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
                domain={effectiveScale === "log" ? ["auto", "auto"] : ["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) => formatCompactMoney(Number(value), currency)}
                width={72}
              />
              <Tooltip
                content={<HistoryTooltip currency={currency} />}
                cursor={{ stroke: "rgba(148,163,184,0.25)", strokeWidth: 1 }}
              />
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
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
