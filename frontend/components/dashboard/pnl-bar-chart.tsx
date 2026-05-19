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

import { useCurrency } from "@/components/currency-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { oppositeCurrency, pickCurrencyValue } from "@/lib/currency";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { ValuationItem } from "@/services/api";

interface PnlBarChartProps {
  items: ValuationItem[];
}

export function PnlBarChart({ items }: PnlBarChartProps) {
  const { currency } = useCurrency();
  const secondaryCurrency = oppositeCurrency(currency);
  const data = items
    .map((item) => ({
      ticker: item.ticker,
      pnl: pickCurrencyValue(currency, item.pnl_ars ?? item.pnl, item.pnl_usd ?? 0),
      pnlSecondary: pickCurrencyValue(
        secondaryCurrency,
        item.pnl_ars ?? item.pnl,
        item.pnl_usd ?? 0,
      ),
    }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 10);

  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>P&L por activo ({currency})</CardTitle>
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
              tickFormatter={(value) => formatCompactMoney(Number(value), currency)}
            />
            <Tooltip
              formatter={(value, _name, payload) => [
                formatMoney(Number(value), currency),
                `${payload.payload.pnl >= 0 ? "Ganancia" : "Perdida"} (${formatMoney(
                  payload.payload.pnlSecondary,
                  secondaryCurrency,
                )})`,
              ]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--foreground))",
              }}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.ticker}
                  fill={entry.pnl >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
