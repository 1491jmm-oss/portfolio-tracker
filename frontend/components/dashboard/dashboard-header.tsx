import { RefreshCcw } from "lucide-react";

import { CurrencyToggle } from "@/components/currency-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

interface DashboardHeaderProps {
  lastUpdatedAt: string | null;
  isLastUpdatedLoading: boolean;
  onRefresh: () => void;
}

function formatLastUpdated(lastUpdatedAt: string | null, isLoading: boolean) {
  if (isLoading) {
    return "Syncing...";
  }

  if (!lastUpdatedAt) {
    return "No snapshots yet";
  }

  return formatDateTime(lastUpdatedAt);
}

export function DashboardHeader({
  lastUpdatedAt,
  isLastUpdatedLoading,
  onRefresh,
}: DashboardHeaderProps) {
  const lastUpdated = formatLastUpdated(lastUpdatedAt, isLastUpdatedLoading);

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          Portfolio Tracker
        </h1>
        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          <span>Updated:</span>
          <span className="font-mono text-foreground/80">{lastUpdated}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CurrencyToggle />
        <ThemeToggle />
        <Button variant="secondary" onClick={onRefresh} className="w-fit">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </header>
  );
}
