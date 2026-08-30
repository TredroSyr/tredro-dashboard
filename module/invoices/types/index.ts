// ---- Shared envelope / pagination (matches Frontend.md §3, §3.1) ----
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ---- Enums (Frontend.md §5 — send/compare these exact strings) ----
export type SalesInvoiceStatus = "fully_paid" | "partially_paid" | "deferred";
export type IncomingInvoiceStatus = "draft" | "issued" | "cancelled";
export type ReturnInvoiceStatus = "draft" | "issued";
export type RefundMethod =
  | ""
  | "cash_refunded_by_rep"
  | "deferred_customer_credit";
export type PaymentSource = "cash" | "customer_credit";
export type CustomerCreditStatus = "pending" | "applied" | "cancelled";

// ---- Sales invoices (§11) ----
export interface SalesInvoiceLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  tax_rate: string;
  /** null means nothing has been returned against this line yet — treat as 0 */
  returned_quantity: string | null;
}

export interface SalesInvoicePayment {
  id: number;
  sales_invoice: number;
  sales_invoice_number: string;
  amount: string;
  /** null on a company-direct sale's payment — it's company cash, not a rep's */
  collected_by: number | null;
  collected_by_name: string | null;
  collected_at: string;
  source: PaymentSource;
  applied_credit: number | null;
  note: string;
  created_at: string;
}

export interface SalesInvoiceReturnSummary {
  id: number;
  number: string;
  status: ReturnInvoiceStatus;
  amount: string;
  overage_amount: string;
  refund_method: RefundMethod;
  issued_at: string | null;
}

export interface SalesInvoice {
  id: number;
  number: string;
  date: string;
  /** null means a company-direct sale — no rep involved (frontend2.md Part D) */
  rep: number | null;
  rep_name: string | null;
  customer: number;
  customer_name: string;
  customer_phone: string;
  warehouse: number;
  company_name: string;
  tax_registration_no: string;
  /** ISO 4217 code, pinned at creation (frontend2.md Part A) */
  currency: string;
  total_amount: string;
  paid_amount: string;
  returned_amount: string;
  balance_due: string;
  overage_amount: string;
  status: SalesInvoiceStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  // present on detail responses only
  lines?: SalesInvoiceLine[];
  payments?: SalesInvoicePayment[];
  returns?: SalesInvoiceReturnSummary[];
  fulfilled_request_ids?: number[];
}

export interface ListSalesInvoicesParams {
  status?: SalesInvoiceStatus;
  customer?: number | string;
  rep?: number | string;
  outstanding?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export type SalesInvoicesListResponse = ApiEnvelope<{
  invoices: SalesInvoice[];
  pagination: Pagination;
}>;
export type SalesInvoiceResponse = ApiEnvelope<{ invoice: SalesInvoice }>;

export interface CreateSalesInvoiceLinePayload {
  product_id: number;
  quantity: string;
  unit_price?: string;
  tax_rate?: string;
}

export interface CreateSalesInvoicePayload {
  customer_id: number;
  lines: CreateSalesInvoiceLinePayload[];
  /** Omit for a company-direct sale; supply a rep id to sell on their behalf. */
  rep?: number;
  warehouse?: number;
  date?: string;
  notes?: string;
  credit_ids?: number[];
  payment_amount?: string;
  payment_collected_at?: string;
  fulfils_request_ids?: number[];
}

export interface RecordPaymentPayload {
  amount: string;
  note?: string;
  collected_at?: string;
  /** admin-only: which rep collected it, when settling at the office */
  collected_by?: number;
}

export type RecordPaymentResponse = ApiEnvelope<{
  payment: SalesInvoicePayment;
  invoice: SalesInvoice;
}>;

// ---- Incoming invoices (§8) ----
export interface IncomingInvoiceLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  tax_rate: string;
}

export interface IncomingInvoice {
  id: number;
  number: string;
  date: string;
  supplier_ref: string;
  company_name: string;
  /** Note: the API returns this key with a capital "I" (company_Image). */
  company_Image?: string | null;
  tax_registration_no: string;
  currency: string;
  warehouse: number;
  warehouse_name: string;
  status: IncomingInvoiceStatus;
  total_amount: string;
  notes: string;
  issued_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  lines?: IncomingInvoiceLine[];
}

export interface ListIncomingInvoicesParams {
  status?: IncomingInvoiceStatus;
  warehouse?: number | string;
  search?: string;
  page?: number;
  page_size?: number;
}

export type IncomingInvoicesListResponse = ApiEnvelope<{
  invoices: IncomingInvoice[];
  pagination: Pagination;
}>;
export type IncomingInvoiceResponse = ApiEnvelope<{
  invoice: IncomingInvoice;
}>;

export interface CreateIncomingInvoiceLinePayload {
  product_id: number;
  quantity: string;
  unit_price?: string;
  tax_rate?: string;
}

/** Most recent incoming-invoice price paid for a product, in one currency (derived client-side — no backend endpoint for this yet). */
export interface LastPurchasePrice {
  price: string;
  currency: string;
  invoiceId: number;
  invoiceNumber: string;
  date: string;
}

export type LastPurchasePricesByCurrency = Record<string, LastPurchasePrice>;

export interface CreateIncomingInvoicePayload {
  warehouse: number;
  /** Settlement currency with the supplier for the whole invoice — every line's `unit_price` is in this currency. */
  currency: string;
  supplier_ref?: string;
  notes?: string;
  date?: string;
  lines: CreateIncomingInvoiceLinePayload[];
}

// ---- Return invoices & customer credits (§13) ----
export interface ReturnInvoiceLine {
  id: number;
  product: number;
  product_name: string;
  unit: number;
  unit_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  tax_rate: string;
  sales_invoice_line: number;
}

export interface ReturnInvoice {
  id: number;
  number: string;
  sales_invoice: number;
  sales_invoice_number: string;
  rep: number | null;
  rep_name: string | null;
  warehouse: number;
  warehouse_name: string;
  /** inherited from the sales invoice it credits */
  currency: string;
  status: ReturnInvoiceStatus;
  amount: string;
  overage_amount: string;
  refund_method: RefundMethod;
  issued_at: string | null;
  notes?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  lines?: ReturnInvoiceLine[];
  /** draft only: what would be refunded if issued right now */
  projected_overage_amount?: string;
}

export interface ListReturnInvoicesParams {
  status?: ReturnInvoiceStatus;
  sales_invoice?: number | string;
  rep?: number | string;
  customer?: number | string;
  search?: string;
  page?: number;
  page_size?: number;
}

export type ReturnInvoicesListResponse = ApiEnvelope<{
  return_invoices: ReturnInvoice[];
  pagination: Pagination;
}>;
export type ReturnInvoiceResponse = ApiEnvelope<{
  return_invoice: ReturnInvoice;
}>;

export interface CreateReturnInvoiceLinePayload {
  sales_invoice_line_id: number;
  quantity: string;
}

export interface CreateReturnInvoicePayload {
  sales_invoice: number;
  notes?: string;
  lines: CreateReturnInvoiceLinePayload[];
  warehouse?: number;
  refund_method?: RefundMethod;
  date?: string;
}

export interface IssueReturnInvoicePayload {
  refund_method?: RefundMethod;
}

export type IssueReturnInvoiceResponse = ApiEnvelope<{
  return_invoice: ReturnInvoice;
  invoice: SalesInvoice;
}>;

export interface PendingCustomerCredit {
  id: number;
  customer: number;
  customer_name: string;
  source_return_invoice: number;
  source_return_invoice_number: string;
  amount: string;
  status: CustomerCreditStatus;
  applied_to_invoice: number | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListCustomerCreditsParams {
  status?: CustomerCreditStatus;
  customer?: number | string;
  rep?: number | string;
  page?: number;
  page_size?: number;
}

export type CustomerCreditsListResponse = ApiEnvelope<{
  credits: PendingCustomerCredit[];
  total_amount: string;
  pagination: Pagination;
}>;

// ---- Payments ledger (§12) ----
export type PaymentCollection = SalesInvoicePayment;

export interface ListPaymentsParams {
  sales_invoice?: number | string;
  source?: PaymentSource;
  rep?: number | string;
  customer?: number | string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export type PaymentsListResponse = ApiEnvelope<{
  payments: PaymentCollection[];
  total_amount: string;
  pagination: Pagination;
}>;

// ---- Reports (§14) ----
export interface OverdueReportInvoiceRow {
  id: number;
  number: string;
  date: string;
  balance_due: string;
  status: SalesInvoiceStatus;
  days_overdue: number;
}

export interface OverdueReportByRep {
  /** null is the "company direct" bucket — label it, don't drop it */
  rep_id: number | null;
  rep_name: string | null;
  invoice_count: number;
  total_balance_due: string;
}

export interface OverdueReportByCustomer {
  customer_id: number;
  customer_name: string;
  invoice_count: number;
  total_balance_due: string;
  invoices: OverdueReportInvoiceRow[];
}

export interface OverdueReport {
  overdue_threshold_days: number;
  generated_at: string;
  totals: { invoice_count: number; total_balance_due: string };
  by_rep: OverdueReportByRep[];
  by_customer: OverdueReportByCustomer[];
}

export interface OverdueReportParams {
  threshold_days?: number;
  rep?: number | string;
  customer?: number | string;
}

export type OverdueReportResponse = ApiEnvelope<{ report: OverdueReport }>;

// ---- Invoice settings (§7) ----
export interface InvoiceSettings {
  company_name: string;
  display_company_name: string;
  tax_registration_no: string;
  address: string;
  phone: string;
  overdue_threshold_days: number;
  updated_at: string;
}

export type InvoiceSettingsResponse = ApiEnvelope<{
  settings: InvoiceSettings;
}>;

export interface UpdateInvoiceSettingsPayload {
  company_name?: string;
  tax_registration_no?: string;
  address?: string;
  phone?: string;
  overdue_threshold_days?: number;
}

// ---- Audit history (shared shape, §8) ----
export interface HistoryEntry {
  id: number;
  actor_type: "subuser" | "rep" | "customer" | string;
  actor_id: number;
  entity_type: string;
  entity_id: number;
  entity_number: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  changes: Record<string, unknown>;
  created_at: string;
}

export type HistoryResponse = ApiEnvelope<{ history: HistoryEntry[] }>;
