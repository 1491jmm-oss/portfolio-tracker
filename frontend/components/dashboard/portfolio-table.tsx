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
import type { AssetType, Currency, ValuationItem } from "@/services/api";

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

const fixedIncomeTypes: AssetType[] = [
  "BONO_SOBERANO",
  "LETRA",
  "BONO_TASA_FIJA",
  "BONO_CER",
  "BONO_DOLAR_LINKED",
  "ON",
];

function isFixedIncome(type: AssetType) {
  return fixedIncomeTypes.includes(type);
}

function formatPrice(price: number | null, currency: Currency | null, type: AssetType) {
  if (price === null || currency === null) {
    return "-";
  }

  if (currency === "USD") {
    return `${formatNumber(price, 2)} USD`;
  }

  if (type === "ACCION" || type === "CEDEAR") {
    return `$${formatNumber(price, 0)}`;
  }

  return `${formatNumber(price, 2)} ARS`;
}

function formatPpc(item: ValuationItem) {
  if (isFixedIncome(item.tipo)) {
    return {
      value: formatNumber(item.ppc * 100, 2),
      detail: "cada 100 VN",
    };
  }

  return {
    value: formatMoney(item.ppc, item.moneda_pnl),
    detail: "por unidad",
  };
}

function formatPosition(item: ValuationItem) {
  if (item.cantidad_actual !== null) {
    return {
      value: formatNumber(item.cantidad_actual),
      label: "Cantidad",
    };
  }

  if (item.nominal_actual !== null) {
    return {
      value: formatNumber(item.nominal_actual),
      label: "VN",
    };
  }

  return {
    value: "-",
    label: "Saldo",
  };
}

export function PortfolioTable({ items }: PortfolioTableProps) {
  return (
    <Card className="overflow-hidden border-white/10 bg-card/85 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Ticker</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad/VN</TableHead>
            <TableHead className="text-right">Precio actual</TableHead>
            <TableHead className="text-right">PPC</TableHead>
            <TableHead className="text-right">Valor ARS</TableHead>
            <TableHead className="text-right">Valor USD</TableHead>
            <TableHead className="text-right">P&L ARS</TableHead>
            <TableHead className="text-right">P&L USD</TableHead>
            <TableHead className="text-right">TR ARS</TableHead>
            <TableHead className="text-right">TR USD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                No hay posiciones abiertas para la fecha consultada.
              </TableCell>
            </TableRow>
          ) : null}

          {items.map((item) => {
            const ppc = formatPpc(item);
            const position = formatPosition(item);
            const pnlArs = item.pnl_ars ?? item.pnl;
            const pnlUsd = item.pnl_usd ?? 0;
            const totalReturnArs = item.total_return_ars ?? item.total_return;
            const totalReturnUsd = item.total_return_usd ?? 0;

            return (
              <TableRow key={item.ticker}>
                <TableCell>
                  <div className="font-mono text-sm font-semibold text-foreground">{item.ticker}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.fx_usado ?? "sin FX"}</div>
                </TableCell>
                <TableCell>
                  <Badge>{item.tipo.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-mono text-sm text-foreground">{position.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{position.label}</div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrice(item.precio, item.moneda_precio, item.tipo)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-mono text-sm text-foreground">{ppc.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{ppc.detail}</div>
                </TableCell>
                <TableCell className="text-right font-mono">{formatMoney(item.valor_ars, "ARS")}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(item.valor_usd, "USD")}</TableCell>
                <TableCell className={cn("text-right font-mono", signedClass(pnlArs))}>
                  <div>{formatMoney(pnlArs, "ARS")}</div>
                  <div className="mt-1 text-xs">{formatPercent(item.pnl_pct)}</div>
                </TableCell>
                <TableCell className={cn("text-right font-mono", signedClass(pnlUsd))}>
                  {formatMoney(pnlUsd, "USD")}
                </TableCell>
                <TableCell className={cn("text-right font-mono", signedClass(totalReturnArs))}>
                  <div>{formatMoney(totalReturnArs, "ARS")}</div>
                  <div className="mt-1 text-xs">{formatPercent(item.total_return_pct)}</div>
                </TableCell>
                <TableCell className={cn("text-right font-mono", signedClass(totalReturnUsd))}>
                  {formatMoney(totalReturnUsd, "USD")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
