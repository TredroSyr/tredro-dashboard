"use client";

import { Badge } from "@/components/ui/badge";
import type { StockTransferStatus } from "../types";

const STATUS_META: Record<
  StockTransferStatus,
  { label: string; variant: "outline" | "warning" | "secondary" | "success" | "destructive" }
> = {
  pending: { label: "بانتظار الموافقة", variant: "outline" },
  modified_by_admin: { label: "تم تعديل الكميات", variant: "warning" },
  pending_rep_confirmation: { label: "بانتظار موافقة المندوب", variant: "warning" },
  confirmed: { label: "موافَق عليه", variant: "secondary" },
  received: { label: "تم الاستلام", variant: "success" },
  cancelled: { label: "ملغى", variant: "destructive" },
};

export function StockTransferStatusBadge({
  status,
}: {
  status: StockTransferStatus;
}) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
