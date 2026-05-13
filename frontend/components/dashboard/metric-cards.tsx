"use client";

import { Activity, LineChart, TrendingUp, WalletCards } from "lucide-react";

import { useCurrency } from "@/components/currency-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, ValuationResponse } from "@/services/api";

interface MetricCardsProps {
  valuation: ValuationResponse;
}

function otherCurrency(currency: Currency): Currency {
  return currency === "ARS" ? "USD" : "ARS";
}

export function MetricCards({ valuation }: MetricCardsProps) {
  const { currency } = useCurrency();
  const secondaryCurrency = otherCurrency(currency);
  const values = {
    total: currency === "ARS" ? valuation.total_ars : valuation.total_usd,
    totalSecondary: secondaryCurrency === "ARS" ? valuation.total_ars : valuation.total_usd,
    cost: currency === "ARS" ? valuation.total_costo_ars : valuation.total_costo_usd,
    costSecondary:
      secondaryCurrency === "ARS" ? valuation.total_costo_ars : valuation.total_costo_usd,
    pnl: currency === "ARS" ? valuation.total_pnl_ars : valuation.total_pnl_usd,
    pnlSecondary: secondaryCurrency === "ARS" ? valuation.total_pnl_ars : valuation.total_pnl_usd,
    totalReturn: currency === "ARS" ? valuation.total_return_ars : valuation.total_return_usd,
    totalReturnSecondary:
      secondaryCurrency === "ARS" ? valuation.total_return_ars : valuation.total_return_usd,
  };

  const metrics = [
    {
      key: "total",
      label: `Total cartera ${currency}`,
      icon: Activity,
      value: values.total,
      detail: formatMoney(values.totalSecondary, secondaryCurrency),
      tone: "neutral",
      pct: null,
    },
    {
      key: "cost",
      label: `Costo ${currency}`,
      icon: WalletCards,
      value: values.cost,
      detail: formatMoney(values.costSecondary, secondaryCurrency),
      tone: "neutral",
      pct: null,
    },
    {
      key: "pnl",
      label: `P&L ${currency}`,
      icon: LineChart,
      value: values.pnl,
      detail: formatMoney(values.pnlSecondary, secondaryCurrency),
      tone: values.pnl >= 0 ? "positive" : "negative",
      pct: valuation.total_pnl_pct,
    },
    {
      key: "return",
      label: `Total Return ${currency}`,
      icon: TrendingUp,
      value: values.totalReturn,
      detail: formatMoney(values.totalReturnSecondary, secondaryCurrency),
      tone: values.totalReturn >= 0 ? "positive" : "negative",
      pct: valuation.total_return_pct,
    },
  ] as const;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.key} className="bg-card/85 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground">{metric.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "font-mono text-2xl font-semibold tracking-normal",
                  metric.tone === "positive" && "text-positive",
                  metric.tone === "negative" && "text-negative",
                )}
              >
                {formatMoney(metric.value, currency)}
              </div>
              {metric.pct !== null ? (
                <div
                  className={cn(
                    "mt-2 font-mono text-base font-semibold",
                    metric.tone === "positive" && "text-positive",
                    metric.tone === "negative" && "text-negative",
                  )}
                >
                  {formatPercent(metric.pct)}
                </div>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
