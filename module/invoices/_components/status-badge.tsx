"use client";

import { Badge } from "@/components/ui/badge";
import type {
  IncomingInvoiceStatus,
  ReturnInvoiceStatus,
  SalesInvoiceStatus,
} from "../types";

const SALES_STATUS_META: Record<
  SalesInvoiceStatus,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  fully_paid: { label: "مدفوعة بالكامل", variant: "success" },
  partially_paid: { label: "مدفوعة جزئياً", variant: "warning" },
  deferred: { label: "آجلة", variant: "secondary" },
};

export function SalesInvoiceStatusBadge({
  status,
  isOverdue,
}: {
  status: SalesInvoiceStatus;
  isOverdue?: boolean;
}) {
  const meta = SALES_STATUS_META[status];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={meta.variant}>{meta.label}</Badge>
      {isOverdue && <Badge variant="destructive">متأخرة</Badge>}
    </div>
  );
}

const DOCUMENT_STATUS_META: Record<
  IncomingInvoiceStatus | ReturnInvoiceStatus,
  { label: string; variant: "outline" | "success" | "destructive" }
> = {
  draft: { label: "مسودة", variant: "outline" },
  issued: { label: "مرحّلة", variant: "success" },
  cancelled: { label: "ملغاة", variant: "destructive" },
};

export function DocumentStatusBadge({
  status,
}: {
  status: IncomingInvoiceStatus | ReturnInvoiceStatus;
}) {
  const meta = DOCUMENT_STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

const CREDIT_STATUS_META: Record<
  "pending" | "applied" | "cancelled",
  { label: string; variant: "warning" | "success" | "destructive" }
> = {
  pending: { label: "متاح للاستخدام", variant: "warning" },
  applied: { label: "مستخدَم", variant: "success" },
  cancelled: { label: "ملغى", variant: "destructive" },
};

export function CreditStatusBadge({
  status,
}: {
  status: "pending" | "applied" | "cancelled";
}) {
  const meta = CREDIT_STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
