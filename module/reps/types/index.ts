import type { CustomerRequestStatus } from "@/module/orders/types";

export type WorkDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface Rep {
  id: number;
  name: string;
  phone: string;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Default work days for the rep
  work_days?: WorkDay[];
}

export interface CreateRepPayload {
  name: string;
  phone: string;
  password: string;
  referral_code: string;
  is_active?: boolean;
}

export interface UpdateRepPayload {
  id: number;
  name?: string;
  phone?: string;
  password?: string;
  referral_code?: string;
  is_active?: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type RepsListResponse = ApiEnvelope<{ reps: Rep[] }>;
export type RepResponse = ApiEnvelope<{ rep: Rep }>;

// ---- Overview (dashboard_overview.md §5 — one rep) ----
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

export interface RepOverview {
  rep: {
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
    work_days: WorkDay[];
  };
  company: { id: number; name: string };
  period: OverviewPeriod;
  currency: OverviewCurrency;
  fx: OverviewFx;
  sales: {
    invoice_count: OverviewCard<number>;
    total_amount: OverviewCard<string>;
    paid_amount: OverviewCard<string>;
    balance_due: OverviewCard<string>;
  };
  /** Runs on a trailing-7-day clock (`visits.window`), not the main date picker — see dashboard_overview.md §5. */
  visits: {
    window: OverviewPeriod;
    count: OverviewCard<number>;
    last_visit_at: string | null;
    days_since_last_visit: number | null;
    visited_customer_count: number;
    unvisited_customer_count: number;
  };
  customer_requests: {
    count: OverviewCard<number>;
    pending_count: number;
    awaiting_delivery_count: number;
    by_status: OverviewStatusCount[];
  };
  customers: {
    assigned: OverviewCard<number>;
    new_via_referral: OverviewCard<number>;
  };
  stock_transfers: { pending_approval_count: number };
}

export interface RepOverviewParams {
  date?: string;
  date_from?: string;
  date_to?: string;
  currency?: string;
}

export type RepOverviewResponse = ApiEnvelope<{ overview: RepOverview }>;
