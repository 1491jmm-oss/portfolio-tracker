import { RefreshCcw, Signal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  date: string;
  onRefresh: () => void;
}

export function DashboardHeader({ date, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="border-primary/30 bg-primary/10 text-primary">
            <Signal className="mr-1 h-3 w-3" />
            Live API
          </Badge>
          <Badge>Valuación {date}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          Portfolio Tracker
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Vista consolidada de posiciones, valuación, P&L y total return.
        </p>
      </div>

      <Button variant="secondary" onClick={onRefresh}>
        <RefreshCcw className="h-4 w-4" />
        Actualizar
      </Button>
    </header>
  );
}
