"use client";

import { useState } from "react";
import { AlertCircle, BarChart3, RefreshCcw } from "lucide-react";

import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { AllocationHistoryChart } from "@/components/dashboard/allocation-history-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DrawdownChart } from "@/components/dashboard/drawdown-chart";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { PnlBarChart } from "@/components/dashboard/pnl-bar-chart";
import { PortfolioHistoryChart } from "@/components/dashboard/portfolio-history-chart";
import { PortfolioTable } from "@/components/dashboard/portfolio-table";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ChartMode, ScaleMode, TimeRange } from "@/lib/chart-controls";
import type { Currency } from "@/services/api";
import { useDrawdowns } from "@/hooks/use-drawdowns";
import { useSnapshotItems } from "@/hooks/use-snapshot-items";
import { useSnapshots } from "@/hooks/use-snapshots";
import { useValuations } from "@/hooks/use-valuations";

const valuationDate = "2026-05-02";

export default function Home() {
  const [historyCurrency, setHistoryCurrency] = useState<Currency>("ARS");
  const [historyTimeRange, setHistoryTimeRange] = useState<TimeRange>("ALL");
  const [historyScaleMode, setHistoryScaleMode] = useState<ScaleMode>("linear");
  const [historyChartMode, setHistoryChartMode] = useState<ChartMode>("absolute");
  const { data, error, isLoading, refetch } = useValuations(valuationDate);
  const {
    data: snapshots,
    error: snapshotsError,
    isLoading: snapshotsLoading,
  } = useSnapshots();
  const {
    data: snapshotItems,
    error: snapshotItemsError,
    isLoading: snapshotItemsLoading,
  } = useSnapshotItems();
  const {
    data: drawdowns,
    error: drawdownsError,
    isLoading: drawdownsLoading,
  } = useDrawdowns(historyCurrency);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <DashboardHeader date={valuationDate} onRefresh={refetch} />

        {isLoading ? <DashboardSkeleton /> : null}

        {!isLoading && error ? (
          <Card className="border-red-500/30 bg-red-500/10">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
                <div>
                  <p className="font-medium text-red-100">No se pudo cargar la valuación</p>
                  <p className="mt-1 text-sm text-red-100/70">{error}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={refetch}>
                <RefreshCcw className="h-4 w-4" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && data ? (
          <>
            <MetricCards valuation={data} />

            <PortfolioHistoryChart
              snapshots={snapshots}
              isLoading={snapshotsLoading}
              error={snapshotsError}
              currency={historyCurrency}
              onCurrencyChange={setHistoryCurrency}
              timeRange={historyTimeRange}
              onTimeRangeChange={setHistoryTimeRange}
              scaleMode={historyScaleMode}
              onScaleModeChange={setHistoryScaleMode}
              chartMode={historyChartMode}
              onChartModeChange={setHistoryChartMode}
            />

            <DrawdownChart
              drawdowns={drawdowns}
              isLoading={drawdownsLoading}
              error={drawdownsError}
              currency={historyCurrency}
              timeRange={historyTimeRange}
            />

            <AllocationHistoryChart
              items={snapshotItems}
              isLoading={snapshotItemsLoading}
              error={snapshotItemsError}
            />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
              <AllocationChart items={data.valuations} />
              <PnlBarChart items={data.valuations} />
            </section>

            <section className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>{data.valuations.length} posiciones valuadas</span>
            </section>

            <PortfolioTable items={data.valuations} />
          </>
        ) : null}
      </div>
    </main>
  );
}
