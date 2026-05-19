"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useCurrency } from "@/components/currency-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pickCurrencyValue } from "@/lib/currency";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { ValuationItem } from "@/services/api";

interface AllocationChartProps {
  items: ValuationItem[];
}

const palette = ["#14b8a6", "#38bdf8", "#a3e635", "#f59e0b", "#f472b6", "#c084fc", "#94a3b8"];

interface AllocationLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
  tipo?: string;
  payload?: {
    tipo?: string;
  };
}

function renderAllocationLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  percent = 0,
  name,
  tipo = "",
  payload,
}: AllocationLabelProps) {
  if (percent < 0.045) {
    return null;
  }

  const radius = outerRadius + 30;
  const radians = (-midAngle * Math.PI) / 180;
  const x = cx + radius * Math.cos(radians);
  const y = cy + radius * Math.sin(radians);
  const isRightSide = x >= cx;
  const label = payload?.tipo ?? tipo ?? name ?? "";
  const displayName = label.length > 18 ? `${label.slice(0, 16)}...` : label;

  return (
    <text
      x={x}
      y={y}
      textAnchor={isRightSide ? "start" : "end"}
      dominantBaseline="central"
      className="fill-foreground text-[11px] font-medium"
    >
      <tspan x={x} dy="-0.35em">{displayName}</tspan>
      <tspan
        x={x}
        dy="1.25em"
        className="fill-muted-foreground font-mono text-[10px] font-normal"
      >
        {(percent * 100).toFixed(1)}%
      </tspan>
    </text>
  );
}

export function AllocationChart({ items }: AllocationChartProps) {
  const { currency } = useCurrency();
  const data = Object.values(
    items.reduce<Record<string, { tipo: string; value: number }>>((acc, item) => {
      acc[item.tipo] ??= { tipo: item.tipo.replaceAll("_", " "), value: 0 };
      acc[item.tipo].value += pickCurrencyValue(currency, item.valor_ars, item.valor_usd);
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);

  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Distribucion por tipo ({currency})</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="tipo"
              cx="50%"
              cy="48%"
              innerRadius={66}
              outerRadius={96}
              paddingAngle={3}
              stroke="rgba(8,13,20,0.95)"
              strokeWidth={3}
              label={renderAllocationLabel}
              labelLine={{
                stroke: "hsl(var(--muted-foreground))",
                strokeOpacity: 0.42,
                strokeWidth: 1,
              }}
            >
              {data.map((entry, index) => (
                <Cell key={entry.tipo} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(Number(value), currency)}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--foreground))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="-mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {data.slice(0, 2).map((entry, index) => (
            <div key={entry.tipo} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 truncate">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: palette[index % palette.length] }}
                />
                <span className="truncate">{entry.tipo}</span>
              </span>
              <span className="font-mono">{formatCompactMoney(entry.value, currency)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
