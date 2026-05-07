import { Activity, DollarSign, LineChart, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ValuationResponse } from "@/services/api";

interface MetricCardsProps {
  valuation: ValuationResponse;
}

const metrics = [
  {
    key: "ars",
    label: "Total cartera ARS",
    icon: DollarSign,
  },
  {
    key: "usd",
    label: "Total cartera USD",
    icon: Activity,
  },
  {
    key: "pnl",
    label: "Total P&L",
    icon: LineChart,
  },
  {
    key: "return",
    label: "Total Return",
    icon: TrendingUp,
  },
] as const;

export function MetricCards({ valuation }: MetricCardsProps) {
  const values = {
    ars: {
      value: formatMoney(valuation.total_ars, "ARS"),
      detail: formatMoney(valuation.total_usd, "USD"),
      tone: "neutral",
    },
    usd: {
      value: formatMoney(valuation.total_usd, "USD"),
      detail: formatMoney(valuation.total_ars, "ARS"),
      tone: "neutral",
    },
    pnl: {
      value: formatMoney(valuation.total_pnl, "ARS"),
      detail: formatPercent(valuation.total_pnl_pct),
      tone: valuation.total_pnl >= 0 ? "positive" : "negative",
    },
    return: {
      value: formatMoney(valuation.total_return, "ARS"),
      detail: formatPercent(valuation.total_return_pct),
      tone: valuation.total_return >= 0 ? "positive" : "negative",
    },
  };

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const current = values[metric.key];
        const Icon = metric.icon;

        return (
          <Card
            key={metric.key}
            className="border-white/10 bg-card/85 backdrop-blur"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground">{metric.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "font-mono text-2xl font-semibold tracking-normal",
                  current.tone === "positive" && "text-emerald-300",
                  current.tone === "negative" && "text-red-300",
                )}
              >
                {current.value}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{current.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
