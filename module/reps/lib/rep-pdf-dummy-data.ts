// ---- PDF profile export — no backend endpoint yet, kept as illustrative/dummy data for the first pass ----
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from "@/module/orders/lib/format";
import type { CustomerRequestStatus } from "@/module/orders/types";
import type { PdfIconName } from "./rep-pdf-icons";

/**
 * `toLocaleString("ar", ...)` (used elsewhere for money) emits Arabic-Indic digits and
 * separators (٠-٩، ٬، ٫) that the embedded Thmanyah PDF font subset doesn't cover, so amounts
 * render as boxes. Force plain Latin digits for anything shown inside the PDF, same reasoning
 * as `formatDateShort`'s `numberingSystem: "latn"`.
 */
export function formatPdfAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface PdfBadgeColor {
  bg: string;
  text: string;
}

export const PDF_BADGE_COLORS: Record<
  "default" | "success" | "warning" | "destructive" | "secondary",
  PdfBadgeColor
> = {
  default: { bg: "#DBEAFE", text: "#2563EB" },
  success: { bg: "#DCFCE7", text: "#16A34A" },
  warning: { bg: "#FFEDD5", text: "#F97316" },
  destructive: { bg: "#FEE2E2", text: "#DC2626" },
  secondary: { bg: "#F3F4F6", text: "#6B7280" },
};

export interface PdfKpi {
  key: string;
  icon: PdfIconName;
  label: string;
  value: string;
  suffix?: string;
  /** Internal PDF anchor id (without "#") to jump to when this KPI card is clicked. */
  linkTo?: string;
}

export const DUMMY_KPIS: PdfKpi[] = [
  {
    key: "assignedCustomers",
    icon: "users",
    label: "العملاء المسندون",
    value: "24",
    linkTo: "customers-table",
  },
  {
    key: "requests",
    icon: "cart",
    label: "الطلبات",
    value: "128",
    linkTo: "orders-table",
  },
  {
    key: "sales",
    icon: "revenue",
    label: "قيمة المبيعات",
    value: formatPdfAmount(3450),
    suffix: "SYP",
    linkTo: "invoices-table",
  },
  {
    key: "newCustomers",
    icon: "addUser",
    label: "عملاء جدد (عبر الإحالة)",
    value: "5",
    linkTo: "customers-table",
  },
  {
    key: "awaitingDelivery",
    icon: "clock",
    label: "بانتظار التسليم",
    value: "7",
    linkTo: "orders-table",
  },
  {
    key: "visits",
    icon: "map",
    label: "الزيارات (آخر 7 أيام)",
    value: "31",
  },
];

export type DummyInvoiceStatus = "fully_paid" | "partially_paid" | "deferred";

export const INVOICE_STATUS_LABEL: Record<DummyInvoiceStatus, string> = {
  fully_paid: "مدفوعة بالكامل",
  partially_paid: "مدفوعة جزئياً",
  deferred: "آجلة",
};

export const INVOICE_STATUS_BADGE_VARIANT: Record<
  DummyInvoiceStatus,
  keyof typeof PDF_BADGE_COLORS
> = {
  fully_paid: "success",
  partially_paid: "warning",
  deferred: "destructive",
};

export interface DummyInvoiceRow {
  number: string;
  date: string;
  customer_name: string;
  total_amount: string;
  currency: string;
  status: DummyInvoiceStatus;
  balance_due: string;
}

export const DUMMY_INVOICES: DummyInvoiceRow[] = [
  { number: "INV-1042", date: "2026-09-10", customer_name: "بقالة الأمانة", total_amount: "450.00", currency: "SYP", status: "fully_paid", balance_due: "0.00" },
  { number: "INV-1041", date: "2026-09-09", customer_name: "سوبر ماركت النور", total_amount: "1200.00", currency: "SYP", status: "partially_paid", balance_due: "300.00" },
  { number: "INV-1039", date: "2026-09-08", customer_name: "محل الرازي", total_amount: "275.50", currency: "SYP", status: "fully_paid", balance_due: "0.00" },
  { number: "INV-1035", date: "2026-09-05", customer_name: "بقالة الفردوس", total_amount: "890.00", currency: "SYP", status: "deferred", balance_due: "890.00" },
  { number: "INV-1030", date: "2026-09-03", customer_name: "سوبر ماركت الحياة", total_amount: "610.25", currency: "SYP", status: "partially_paid", balance_due: "150.00" },
  { number: "INV-1027", date: "2026-09-01", customer_name: "محل السلام", total_amount: "340.00", currency: "SYP", status: "fully_paid", balance_due: "0.00" },
];

export interface DummyCustomerRow {
  name: string;
  phone: string;
  category: string;
  is_active: boolean;
}

export const DUMMY_CUSTOMERS: DummyCustomerRow[] = [
  { name: "بقالة الأمانة", phone: "0933000111", category: "بقالة", is_active: true },
  { name: "سوبر ماركت النور", phone: "0933000222", category: "سوبر ماركت", is_active: true },
  { name: "محل الرازي", phone: "0933000333", category: "صيدلية", is_active: true },
  { name: "بقالة الفردوس", phone: "0933000444", category: "بقالة", is_active: false },
  { name: "سوبر ماركت الحياة", phone: "0933000555", category: "سوبر ماركت", is_active: true },
  { name: "محل السلام", phone: "0933000666", category: "بقالة", is_active: true },
];

export interface DummyOrderRow {
  customer_name: string;
  status: CustomerRequestStatus;
  line_count: number;
  created_at: string;
}

export const DUMMY_ORDERS: DummyOrderRow[] = [
  { customer_name: "بقالة الأمانة", status: "fulfilled", line_count: 5, created_at: "2026-09-10" },
  { customer_name: "سوبر ماركت النور", status: "pending", line_count: 3, created_at: "2026-09-10" },
  { customer_name: "محل الرازي", status: "accepted", line_count: 8, created_at: "2026-09-09" },
  { customer_name: "بقالة الفردوس", status: "rejected", line_count: 2, created_at: "2026-09-07" },
  { customer_name: "سوبر ماركت الحياة", status: "fulfilled", line_count: 6, created_at: "2026-09-06" },
  { customer_name: "محل السلام", status: "cancelled", line_count: 1, created_at: "2026-09-04" },
];

export { STATUS_LABEL as ORDER_STATUS_LABEL, STATUS_BADGE_VARIANT as ORDER_STATUS_BADGE_VARIANT };
