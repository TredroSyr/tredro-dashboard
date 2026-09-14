import type { CustomerRequestStatus } from "@/module/orders/types";

export type WorkDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface AssignedRepDetail {
  id: number;
  name: string;
  phone: string;
  company_id?: number;
  referral_code?: string;
  work_days?: WorkDay[];
}

export interface CategoryDetail {
  id: number;
  name: string;
  is_global: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  category_details: CategoryDetail | null;
  assigned_reps_details: AssignedRepDetail[];
  referral_code_used: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  category?: number | null;
  assigned_reps?: number[];
  is_active?: boolean;
}

export interface UpdateCustomerPayload {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  category?: number | null;
  assigned_reps?: number[];
  is_active?: boolean;
}

export interface Assignment {
  rep_id: number;
  work_days?: WorkDay[];
}

export interface AssignRepsPayload {
  id: number;
  // Legacy format
  rep_ids?: number[];
  // New format with work days
  assignments?: Assignment[];
  // Client-only flag (never sent to the backend, see api/index.ts) — set when
  // this call only updates visit days for an already-assigned rep, so the
  // mutation shows "visit days updated" instead of "rep assigned".
  visitDaysOnly?: boolean;
}

export interface RemoveRepsPayload {
  id: number;
  rep_ids?: number[];
}

export type BulkActionType =
  | "assign_rep"
  | "assign_category"
  | "remove_rep"
  | "remove_category"
  | "delete";

export interface BulkActionPayload {
  action: BulkActionType;
  customer_ids: number[];
  rep_id?: number;
  category_id?: number;
  work_days?: WorkDay[];
}

export interface BulkActionResult {
  total: number;
  successful: number;
  failed: number;
  failed_ids: number[];
}

export interface ImportError {
  row: number;
  data: Record<string, unknown>;
  errors: Record<string, string[]>;
}

export interface CreatedCustomerRow {
  id: number;
  name: string;
  phone: string;
  row: number;
}

export interface ImportExcelResult {
  total_rows: number;
  successful: number;
  failed: number;
  created_customers: CreatedCustomerRow[];
  errors: ImportError[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type CustomersListResponse = ApiEnvelope<{ customers: Customer[] }>;
export type CustomerResponse = ApiEnvelope<{ customer: Customer }>;
export type BulkActionResponse = ApiEnvelope<BulkActionResult>;
export type ImportExcelResponse = ApiEnvelope<ImportExcelResult>;

// ---- Overview (dashboard_overview.md §6 — one customer) ----
/** Every "figure with a trend arrow". `change_pct` is null whenever `previous` is zero/absent. */
export interface OverviewCard<T = string> {
  value: T;
  previous: T;
  change_pct: number | null;
}

export interface OverviewPeriod {
  date_from: string;
  date_to: string;
  previous_date_from: string;
  previous_date_to: string;
}

export interface OverviewCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface OverviewFx {
  target: string;
  as_of: string | null;
  stale: boolean;
  rates: Record<string, string>;
}

/** A status breakdown always lists every status, including zeros — use `status` as the key, `label` as an English fallback. */
export interface OverviewStatusCount {
  status: CustomerRequestStatus | string;
  label: string;
  count: number;
}

export interface CustomerOverview {
  customer: { id: number; name: string; phone: string; is_active: boolean };
  company: { id: number; name: string };
  period: OverviewPeriod;
  currency: OverviewCurrency;
  fx: OverviewFx;
  purchases: {
    invoice_count: OverviewCard<number>;
    total_amount: OverviewCard<string>;
    average_amount: OverviewCard<string>;
    last_invoice_at: string | null;
  };
  payments: {
    collected: OverviewCard<string>;
    outstanding: { invoice_count: number; balance_due: string };
    overdue: { invoice_count: number; balance_due: string };
  };
  customer_requests: {
    count: OverviewCard<number>;
    /** every request ever raised with this company — the whole relationship, not just this window */
    total_count: number;
    pending_count: number;
    awaiting_delivery_count: number;
    by_status: OverviewStatusCount[];
    last_request_at: string | null;
  };
  /** Runs on a trailing-7-day clock (`visits.window`), not the main date picker — see dashboard_overview.md §6. */
  visits: {
    window: OverviewPeriod;
    count: OverviewCard<number>;
    last_visit_at: string | null;
    days_since_last_visit: number | null;
  };
  reps: { assigned: OverviewCard<number> };
}

export interface CustomerOverviewParams {
  date?: string;
  date_from?: string;
  date_to?: string;
  currency?: string;
}

export type CustomerOverviewResponse = ApiEnvelope<CustomerOverview>;
