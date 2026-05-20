"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, BarChart3, ChevronDown, LineChart, RefreshCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
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
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import { useDrawdowns } from "@/hooks/use-drawdowns";
import { useSnapshotItems } from "@/hooks/use-snapshot-items";
import { useSnapshots } from "@/hooks/use-snapshots";
import { useValuations } from "@/hooks/use-valuations";
import type { Snapshot } from "@/services/api";

const valuationDate = "2026-05-02";

function getLatestSnapshotUpdatedAt(snapshots: Snapshot[]) {
  return snapshots.reduce<string | null>((latest, snapshot) => {
    if (!latest) {
      return snapshot.created_at;
    }

    return new Date(snapshot.created_at).getTime() > new Date(latest).getTime()
      ? snapshot.created_at
      : latest;
  }, null);
}

function SectionHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-normal text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
    </div>
  );
}

export default function Home() {
  const { currency } = useCurrency();
  const [historyTimeRange, setHistoryTimeRange] = useState<TimeRange>("ALL");
  const [historyScaleMode, setHistoryScaleMode] = useState<ScaleMode>("linear");
  const [historyChartMode, setHistoryChartMode] = useState<ChartMode>("absolute");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { data, error, isLoading, refetch } = useValuations(valuationDate);
  const {
    data: snapshots,
    error: snapshotsError,
    isLoading: snapshotsLoading,
    refetch: refetchSnapshots,
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
  } = useDrawdowns(currency);
  const latestSnapshotUpdatedAt = useMemo(
    () => getLatestSnapshotUpdatedAt(snapshots),
    [snapshots],
  );
  const refreshDashboard = useCallback(() => {
    void refetch();
    void refetchSnapshots();
  }, [refetch, refetchSnapshots]);

  return (
    <AppShell>
          <DashboardHeader
            lastUpdatedAt={latestSnapshotUpdatedAt}
            isLastUpdatedLoading={snapshotsLoading}
            onRefresh={refreshDashboard}
          />

          {isLoading ? <DashboardSkeleton /> : null}

          {!isLoading && error ? (
            <Card className="border-red-500/25 bg-red-500/10">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
                  <div>
                    <p className="font-medium text-red-100">No se pudo cargar la valuacion</p>
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

              <section className="space-y-4">
                <SectionHeader
                  title="Holdings"
                  description="Posiciones actuales, distribucion y contribucion al resultado."
                  meta={
                    <span className="inline-flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      {data.valuations.length} posiciones valuadas
                    </span>
                  }
                />
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
                  <div className="min-w-0">
                    <PortfolioTable items={data.valuations} />
                  </div>
                  <aside className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
                    <AllocationChart items={data.valuations} />
                    <PnlBarChart items={data.valuations} />
                  </aside>
                </div>
              </section>

              <section className="space-y-4">
                <SectionHeader
                  title="Portfolio Evolution"
                  description="El grafico principal de patrimonio historico contra costo invertido."
                />
                <PortfolioHistoryChart
                  snapshots={snapshots}
                  isLoading={snapshotsLoading}
                  error={snapshotsError}
                  timeRange={historyTimeRange}
                  onTimeRangeChange={setHistoryTimeRange}
                  scaleMode={historyScaleMode}
                  onScaleModeChange={setHistoryScaleMode}
                  chartMode={historyChartMode}
                  onChartModeChange={setHistoryChartMode}
                  title="Portfolio Evolution"
                  description={
                    historyChartMode === "absolute"
                      ? "Portfolio value contra cost basis"
                      : "Portfolio base 100 contra benchmark dinamico"
                  }
                  heightClassName="h-[420px]"
                />
              </section>

              <section className="space-y-4">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((current) => !current)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card/70 px-5 py-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:border-primary/25 hover:bg-card dark:shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
                >
                  <span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <LineChart className="h-4 w-4 text-primary" />
                      Advanced Analytics
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Drawdowns y allocation history.
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform",
                      advancedOpen && "rotate-180",
                    )}
                  />
                </button>

                {advancedOpen ? (
                  <div className="grid gap-5">
                    <DrawdownChart
                      drawdowns={drawdowns}
                      isLoading={drawdownsLoading}
                      error={drawdownsError}
                      timeRange={historyTimeRange}
                    />

                    <AllocationHistoryChart
                      items={snapshotItems}
                      isLoading={snapshotItemsLoading}
                      error={snapshotItemsError}
                    />
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
    </AppShell>
  );
}
