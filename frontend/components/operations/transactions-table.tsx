"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Movement } from "@/services/api";

interface TransactionsTableProps {
  movements: Movement[];
  isLoading: boolean;
  isMutating: boolean;
  onDelete: (movementId: number) => Promise<void>;
}

function displayType(movement: Movement) {
  if (movement.tipo_movimiento === "COMPRA") {
    return "BUY";
  }
  if (movement.tipo_movimiento === "VENTA") {
    return "SELL";
  }
  if (movement.tipo_movimiento === "TRANSFERENCIA" && (movement.cash_flow ?? 0) >= 0) {
    return "DEPOSIT";
  }
  if (movement.tipo_movimiento === "TRANSFERENCIA" && (movement.cash_flow ?? 0) < 0) {
    return "WITHDRAWAL";
  }
  return movement.tipo_movimiento;
}

function movementUnits(movement: Movement) {
  const value = movement.cantidad ?? movement.nominal;
  return value === null ? "-" : formatNumber(value);
}

function movementAmount(movement: Movement) {
  if (movement.cash_flow !== null) {
    return formatMoney(movement.cash_flow, movement.moneda);
  }

  const units = movement.cantidad ?? movement.nominal ?? 0;
  const price = movement.precio ?? 0;
  const gross = units * price;
  const signedAmount = movement.tipo_movimiento === "VENTA" ? gross - movement.comision : gross + movement.comision;

  return formatMoney(signedAmount, movement.moneda);
}

function brokerFromNotes(notes: string | null) {
  if (!notes?.startsWith("Broker: ")) {
    return "-";
  }

  return notes.replace("Broker: ", "");
}

export function TransactionsTable({
  movements,
  isLoading,
  isMutating,
  onDelete,
}: TransactionsTableProps) {
  const sortedMovements = [...movements].sort((left, right) => {
    const dateSort = right.fecha.localeCompare(left.fecha);
    return dateSort !== 0 ? dateSort : right.id - left.id;
  });

  return (
    <Card className="overflow-hidden bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Transactions Table</CardTitle>
        <p className="text-sm text-muted-foreground">
          Movimientos ordenados por fecha descendente.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead className="w-12 text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    Todavía no hay transacciones cargadas.
                  </TableCell>
                </TableRow>
              ) : null}

              {sortedMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="font-mono">{movement.fecha}</TableCell>
                  <TableCell>
                    <Badge>{displayType(movement)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-foreground">
                    {movement.ticker}
                  </TableCell>
                  <TableCell className="text-right font-mono">{movementUnits(movement)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {movement.precio === null ? "-" : formatMoney(movement.precio, movement.moneda)}
                  </TableCell>
                  <TableCell>{movement.moneda}</TableCell>
                  <TableCell className="text-right font-mono">{movementAmount(movement)}</TableCell>
                  <TableCell className="text-muted-foreground">{brokerFromNotes(movement.observaciones)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isMutating}
                      aria-label={`Delete transaction ${movement.id}`}
                      onClick={() => void onDelete(movement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
