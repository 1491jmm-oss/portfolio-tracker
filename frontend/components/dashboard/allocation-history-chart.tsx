"use client";

import { AlertCircle, Layers3 } from "lucide-react";
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
import { useCurrency } from "@/components/currency-provider";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SnapshotItem } from "@/services/api";

interface AllocationHistoryChartProps {
  items: SnapshotItem[];
  isLoading: boolean;
  error: string | null;
}

interface AllocationDatum {
  fecha: string;
  [key: string]: number | string;
}

const palette = [
  "#22d3ee",
  "#14b8a6",
  "#a3e635",
  "#f59e0b",
  "#f472b6",
  "#c084fc",
  "#60a5fa",
  "#fb7185",
  "#34d399",
  "#facc15",
  "#818cf8",
  "#2dd4bf",
];

function formatDateLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function buildAllocationData(items: SnapshotItem[]) {
  const tickers = Array.from(new Set(items.map((item) => item.ticker))).sort();
  const valuesByDate = new Map<string, SnapshotItem[]>();

  for (const item of items) {
    valuesByDate.set(item.fecha, [...(valuesByDate.get(item.fecha) ?? []), item]);
  }

  const data = Array.from(valuesByDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fecha, dateItems]) => {
      const totalWeight = dateItems.reduce((sum, item) => sum + item.peso_portfolio_pct, 0);
      const row: AllocationDatum = { fecha };

      for (const ticker of tickers) {
        const item = dateItems.find((candidate) => candidate.ticker === ticker);
        row[ticker] =
          item && totalWeight > 0 ? item.peso_portfolio_pct / totalWeight : 0;
        if (item) {
          row[`${ticker}__valor_ars`] = item.valor_ars;
          row[`${ticker}__valor_usd`] = item.valor_usd;
        }
      }

      return row;
    });

  return { data, tickers };
}

function AllocationTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value: number;
    color?: string;
    payload: AllocationDatum;
  }>;
  label?: string;
  currency: "ARS" | "USD";
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const rows = payload
    .filter((item) => Number(item.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));

  return (
    <div className="max-h-80 min-w-72 overflow-auto rounded-md border border-border bg-card p-3 text-sm shadow-xl">
      <div className="mb-2 font-medium text-foreground">Fecha: {label}</div>
      <div className="space-y-2">
        {rows.map((row) => {
          const ticker = String(row.dataKey);
          const valorArs = Number(row.payload[`${ticker}__valor_ars`] ?? 0);
          const valorUsd = Number(row.payload[`${ticker}__valor_usd`] ?? 0);
          const value = currency === "ARS" ? valorArs : valorUsd;

          return (
            <div key={ticker} className="border-b border-border/70 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {ticker}
                </span>
                <span className="font-mono text-primary">{formatPercent(Number(row.value))}</span>
              </div>
              <div className="mt-1 flex justify-end text-xs text-muted-foreground">
                <span>{formatMoney(value, currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AllocationHistoryChart({
  items,
  isLoading,
  error,
}: AllocationHistoryChartProps) {
  const { currency } = useCurrency();
  const { data, tickers } = buildAllocationData(items);

  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Allocation history</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Evolución del peso por ticker sobre el patrimonio
          </p>
        </div>
        <Layers3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="h-[360px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-md border border-red-500/25 bg-red-500/10 p-5 text-red-100">
            <div className="flex max-w-md items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div>
                <p className="font-medium">No se pudo cargar allocation history</p>
                <p className="mt-1 text-sm text-red-100/70">{error}</p>
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Todavía no hay snapshot items guardados.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} stackOffset="expand" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
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
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) => formatPercent(Number(value))}
                width={56}
              />
              <Tooltip content={<AllocationTooltip currency={currency} />} />
              {tickers.map((ticker, index) => (
                <Area
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stackId="allocation"
                  stroke={palette[index % palette.length]}
                  fill={palette[index % palette.length]}
                  fillOpacity={0.78}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      {!isLoading && !error && tickers.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-5 pb-5 text-xs text-muted-foreground">
          {tickers.slice(0, 12).map((ticker, index) => (
            <span key={ticker} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              {ticker}
            </span>
          ))}
          {tickers.length > 12 ? (
            <span className={cn("text-muted-foreground/80")}>+{tickers.length - 12} más</span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
