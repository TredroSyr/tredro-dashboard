"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoneyParts } from "../lib/format";

/** Highlights a document's headline amount (e.g. total_amount) as a badge, with the currency label in the primary color. */
export function AmountBadge({
  amount,
  currency,
  className,
}: {
  amount: string | number | null | undefined;
  currency?: string;
  className?: string;
}) {
  const { amount: formattedAmount, label } = formatMoneyParts(amount, currency);
  return (
    <Badge
      variant="outline"
      className={cn("h-6 gap-1.5 px-2.5 text-sm", className)}
    >
      <span>{formattedAmount}</span>
      <span className="text-primary">{label}</span>
    </Badge>
  );
}
