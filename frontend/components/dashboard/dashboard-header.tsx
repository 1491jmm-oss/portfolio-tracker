import { RefreshCcw } from "lucide-react";

import { CurrencyToggle } from "@/components/currency-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  date: string;
  onRefresh: () => void;
}

export function DashboardHeader({ date, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          Portfolio Tracker
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ultima actualizacion: <span className="font-mono text-foreground/80">{date}</span>
        </p>
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
