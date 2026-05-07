import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ValuationItem } from "@/services/api";

interface PortfolioTableProps {
  items: ValuationItem[];
}

function signedClass(value: number) {
  if (value > 0) {
    return "text-emerald-300";
  }

  if (value < 0) {
    return "text-red-300";
  }

  return "text-muted-foreground";
}

export function PortfolioTable({ items }: PortfolioTableProps) {
  return (
    <Card className="overflow-hidden border-white/10 bg-card/85 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Ticker</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor ARS</TableHead>
            <TableHead className="text-right">Valor USD</TableHead>
            <TableHead className="text-right">PPC</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
            <TableHead className="text-right">Total Return</TableHead>
            <TableHead className="text-right">Total Return %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No hay posiciones abiertas para la fecha consultada.
              </TableCell>
            </TableRow>
          ) : null}

          {items.map((item) => (
            <TableRow key={item.ticker}>
              <TableCell>
                <div className="font-mono text-sm font-semibold text-foreground">{item.ticker}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {item.cantidad_actual !== null
                    ? `${formatNumber(item.cantidad_actual)} unidades`
                    : item.nominal_actual !== null
                      ? `${formatNumber(item.nominal_actual)} nominal`
                      : "saldo"}
                </div>
              </TableCell>
              <TableCell>
                <Badge>{item.tipo.replaceAll("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">{formatMoney(item.valor_ars, "ARS")}</TableCell>
              <TableCell className="text-right font-mono">{formatMoney(item.valor_usd, "USD")}</TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(item.ppc, item.moneda_pnl)}
              </TableCell>
              <TableCell className={cn("text-right font-mono", signedClass(item.pnl))}>
                {formatMoney(item.pnl, item.moneda_pnl)}
              </TableCell>
              <TableCell className={cn("text-right font-mono", signedClass(item.pnl))}>
                {formatPercent(item.pnl_pct)}
              </TableCell>
              <TableCell className={cn("text-right font-mono", signedClass(item.total_return))}>
                {formatMoney(item.total_return, item.moneda_pnl)}
              </TableCell>
              <TableCell className={cn("text-right font-mono", signedClass(item.total_return))}>
                {formatPercent(item.total_return_pct)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
