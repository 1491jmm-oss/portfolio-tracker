"use client";

import { AlertCircle, BarChart3, RefreshCcw } from "lucide-react";

import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { PnlBarChart } from "@/components/dashboard/pnl-bar-chart";
import { PortfolioHistoryChart } from "@/components/dashboard/portfolio-history-chart";
import { PortfolioTable } from "@/components/dashboard/portfolio-table";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSnapshots } from "@/hooks/use-snapshots";
import { useValuations } from "@/hooks/use-valuations";

const valuationDate = "2026-05-02";

export default function Home() {
  const { data, error, isLoading, refetch } = useValuations(valuationDate);
  const {
    data: snapshots,
    error: snapshotsError,
    isLoading: snapshotsLoading,
  } = useSnapshots();

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
