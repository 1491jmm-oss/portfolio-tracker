"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CurrencyToggle } from "@/components/currency-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionForm } from "@/components/operations/transaction-form";
import { TransactionsTable } from "@/components/operations/transactions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMovements } from "@/hooks/use-movements";

export default function OperationsPage() {
  const {
    data: movements,
    error,
    isLoading,
    isMutating,
    addMovement,
    removeMovement,
    refetch,
  } = useMovements();

  return (
    <AppShell>
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            Operations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Transaction layer para cargar movimientos reales y alimentar posiciones derivadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CurrencyToggle />
          <ThemeToggle />
          <Button variant="secondary" onClick={refetch}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {error ? (
        <Card className="border-red-500/25 bg-red-500/10">
          <CardContent className="flex items-start gap-3 p-5 text-red-100">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
            <div>
              <p className="font-medium">No se pudo sincronizar Operations</p>
              <p className="mt-1 text-sm text-red-100/70">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-5">
        <TransactionForm onSubmit={addMovement} isSubmitting={isMutating} />
        <TransactionsTable
          movements={movements}
          isLoading={isLoading}
          isMutating={isMutating}
          onDelete={removeMovement}
        />
      </section>
    </AppShell>
  );
}
