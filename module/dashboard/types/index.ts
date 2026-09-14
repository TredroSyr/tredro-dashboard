export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---- Overview (dashboard_overview.md §3 — the dashboard home screen) ----
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
  status: string;
  label: string;
  count: number;
}

export type StockTransferStatus =
  | "pending"
  | "modified_by_admin"
  | "pending_rep_confirmation"
  | "confirmed"
  | "received"
  | "cancelled";

export interface TopRep {
  rep_id: number;
  name: string;
  invoice_count: number;
  total_amount: string;
  change_pct: number | null;
}

export interface TopProduct {
  product_id: number;
  name: string;
  quantity_sold: string;
  total_amount: string;
  change_pct: number | null;
}

export interface CompanyOverview {
  company: { id: number; name: string };
  period: OverviewPeriod;
  currency: OverviewCurrency;
  fx: OverviewFx;
  sales: {
    invoice_count: OverviewCard<number>;
    total_amount: OverviewCard<string>;
    paid_amount: OverviewCard<string>;
    balance_due: OverviewCard<string>;
    selling_rep_count: OverviewCard<number>;
  };
  invoices: {
    incoming: { count: OverviewCard<number>; total_amount: OverviewCard<string> };
    returns: { count: OverviewCard<number>; total_amount: OverviewCard<string> };
    total_count: OverviewCard<number>;
  };
  customer_requests: {
    count: OverviewCard<number>;
    pending_count: number;
    by_status: OverviewStatusCount[];
  };
  stock_transfers: {
    count: OverviewCard<number>;
    pending_approval_count: number;
    by_status: OverviewStatusCount[];
  };
  customers: {
    /** every customer on the platform, not only this company's — see dashboard_overview.md §3 */
    platform_total: OverviewCard<number>;
    /** this company's own reps' customers */
    company_total: OverviewCard<number>;
    new_via_referral: OverviewCard<number>;
  };
  reps: {
    active: OverviewCard<number>;
    new: OverviewCard<number>;
    with_sales: OverviewCard<number>;
  };
  top_reps: TopRep[];
  top_products: TopProduct[];
}

export interface CompanyOverviewParams {
  date?: string;
  date_from?: string;
  date_to?: string;
  currency?: string;
  /** rows per leaderboard — default 5, max 50 */
  limit?: number;
}

export type CompanyOverviewResponse = ApiEnvelope<{ overview: CompanyOverview }>;
