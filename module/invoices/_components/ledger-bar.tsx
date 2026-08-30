"use client";

import { cn } from "@/lib/utils";
import { formatMoney, num } from "../lib/format";

interface LedgerBarProps {
  totalAmount: string;
  paidAmount: string;
  returnedAmount: string;
  balanceDue: string;
  overageAmount?: string;
  size?: "sm" | "lg";
  isOverdue?: boolean;
  className?: string;
}

/**
 * Visualizes balance_due = max(0, total - paid - returned) as a single bar
 * instead of three numbers the reader has to subtract in their head:
 * filled = paid, hatched = returned, hollow = still owed.
 */
export function LedgerBar({
  totalAmount,
  paidAmount,
  returnedAmount,
  balanceDue,
  overageAmount,
  size = "sm",
  isOverdue = false,
  className,
}: LedgerBarProps) {
  const total = num(totalAmount);
  const paid = num(paidAmount);
  const returned = num(returnedAmount);
  const balance = num(balanceDue);
  const overage = num(overageAmount);

  const paidPct = total > 0 ? Math.min(paid, total) / total : balance === 0 ? 1 : 0;
  const remainingAfterPaid = total > 0 ? Math.max(total - Math.min(paid, total), 0) : 0;
  const returnedPct = total > 0 ? Math.min(returned, remainingAfterPaid) / total : 0;
  const balancePct = Math.max(0, 1 - paidPct - returnedPct);

  const label = `مدفوع ${formatMoney(paidAmount)} من ${formatMoney(
    totalAmount,
  )}${returned > 0 ? `، مرتجع ${formatMoney(returnedAmount)}` : ""}، المتبقي ${formatMoney(
    balanceDue,
  )}`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="img"
        aria-label={label}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-3",
        )}
      >
        <div className="absolute inset-y-0 right-0 flex h-full w-full flex-row-reverse">
          <div
            className="h-full shrink-0 bg-primary motion-safe:transition-all motion-safe:duration-500"
            style={{ width: `${paidPct * 100}%` }}
          />
          <div
            className="h-full shrink-0 opacity-70 motion-safe:transition-all motion-safe:duration-500"
            style={{
              width: `${returnedPct * 100}%`,
              backgroundImage:
                "repeating-linear-gradient(-45deg, var(--muted-foreground) 0 3px, transparent 3px 6px)",
            }}
          />
          <div
            className={cn(
              "h-full shrink-0 motion-safe:transition-all motion-safe:duration-500",
              isOverdue ? "bg-destructive/25" : "bg-transparent",
            )}
            style={{ width: `${balancePct * 100}%` }}
          />
        </div>
      </div>

      {size === "lg" && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <LegendDot colorClass="bg-primary" label="مدفوع" value={formatMoney(paidAmount)} />
          {returned > 0 && (
            <LegendDot
              hatched
              label="مرتجع"
              value={formatMoney(returnedAmount)}
            />
          )}
          <LegendDot
            colorClass={isOverdue ? "bg-destructive/50" : "bg-muted"}
            label="المتبقي"
            value={formatMoney(balanceDue)}
          />
          {overage > 0 && (
            <span className="font-medium text-warning">
              زيادة مستحقة للزبون: {formatMoney(overageAmount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function LegendDot({
  colorClass,
  hatched,
  label,
  value,
}: {
  colorClass?: string;
  hatched?: boolean;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn("size-2 shrink-0 rounded-full", colorClass)}
        style={
          hatched
            ? {
                backgroundImage:
                  "repeating-linear-gradient(-45deg, var(--muted-foreground) 0 1.5px, transparent 1.5px 3px)",
              }
            : undefined
        }
      />
      {label}: <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
