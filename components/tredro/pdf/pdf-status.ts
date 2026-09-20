// Status label + badge colour maps used by the profile PDF tables (rep + customer).
import type { SalesInvoiceStatus } from "@/module/invoices/types";
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from "@/module/orders/lib/format";
import type { PDF_BADGE_COLORS } from "./pdf-utils";

export const INVOICE_STATUS_LABEL: Record<SalesInvoiceStatus, string> = {
  fully_paid: "مدفوعة بالكامل",
  partially_paid: "مدفوعة جزئياً",
  deferred: "آجلة",
};

export const INVOICE_STATUS_BADGE_VARIANT: Record<
  SalesInvoiceStatus,
  keyof typeof PDF_BADGE_COLORS
> = {
  fully_paid: "success",
  partially_paid: "warning",
  deferred: "destructive",
};

export { STATUS_LABEL as ORDER_STATUS_LABEL, STATUS_BADGE_VARIANT as ORDER_STATUS_BADGE_VARIANT };
