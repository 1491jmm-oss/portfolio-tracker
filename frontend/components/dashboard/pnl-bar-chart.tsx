"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { ValuationItem } from "@/services/api";

interface PnlBarChartProps {
  items: ValuationItem[];
}

export function PnlBarChart({ items }: PnlBarChartProps) {
  const data = items
    .map((item) => ({
      ticker: item.ticker,
      pnl: item.moneda_pnl === "USD" ? item.pnl * (item.valor_ars / Math.max(item.valor_usd, 1)) : item.pnl,
      raw: item.pnl,
      moneda: item.moneda_pnl,
    }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 10);

  return (
    <Card className="border-white/10 bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>P&L por activo</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ticker"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => formatCompactMoney(Number(value), "ARS")}
            />
            <Tooltip
              formatter={(value, _name, payload) => [
                formatMoney(Number(value), "ARS"),
                `${payload.payload.raw >= 0 ? "Ganancia" : "Pérdida"} (${formatMoney(
                  payload.payload.raw,
                  payload.payload.moneda,
                )})`,
              ]}
              contentStyle={{
                background: "#101722",
                border: "1px solid rgba(148,163,184,0.25)",
                borderRadius: 8,
                color: "#f8fafc",
              }}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.ticker} fill={entry.pnl >= 0 ? "#34d399" : "#f87171"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
