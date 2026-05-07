"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { ValuationItem } from "@/services/api";

interface AllocationChartProps {
  items: ValuationItem[];
}

const palette = ["#14b8a6", "#38bdf8", "#a3e635", "#f59e0b", "#f472b6", "#c084fc", "#94a3b8"];

export function AllocationChart({ items }: AllocationChartProps) {
  const data = Object.values(
    items.reduce<Record<string, { tipo: string; value: number }>>((acc, item) => {
      acc[item.tipo] ??= { tipo: item.tipo.replaceAll("_", " "), value: 0 };
      acc[item.tipo].value += item.valor_ars;
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);

  return (
    <Card className="border-white/10 bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Distribución por tipo</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="tipo"
              innerRadius={72}
              outerRadius={112}
              paddingAngle={3}
              stroke="rgba(8,13,20,0.95)"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.tipo} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(Number(value), "ARS")}
              contentStyle={{
                background: "#101722",
                border: "1px solid rgba(148,163,184,0.25)",
                borderRadius: 8,
                color: "#f8fafc",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="-mt-8 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {data.slice(0, 4).map((entry, index) => (
            <div key={entry.tipo} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 truncate">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: palette[index % palette.length] }}
                />
                <span className="truncate">{entry.tipo}</span>
              </span>
              <span className="font-mono">{formatCompactMoney(entry.value, "ARS")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
