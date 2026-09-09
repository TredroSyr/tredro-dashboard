// Matches the Company Dashboard customer-requests API doc.
// A request is a signal, not an order: it moves no stock and creates no debt.
// This surface is read-only — there is no create/update/delete here.

export type CustomerRequestStatus =
  | "pending"
  | "accepted"
  | "fulfilled"
  | "rejected"
  | "cancelled";

export interface CustomerRequestLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  desired_quantity: string;
  /** Always null on this admin endpoint — requests carry no agreed price. Never render as 0. */
  unit_price: string | null;
  line_total: string | null;
}

export interface CustomerRequest {
  id: number;
  company: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  /** Who was notified when the request was filed — null forever if nobody was, even after a later assignment. */
  rep: number | null;
  rep_name: string | null;
  status: CustomerRequestStatus;
  fulfilled_by_invoice: number | null;
  fulfilled_by_invoice_number: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string;
  line_count: number;
  /** Live flag: true when this customer has no active rep in this company right now. Actionable only here. */
  needs_rep_assignment: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerRequestDetail extends CustomerRequest {
  lines: CustomerRequestLine[];
  /** Always null on this admin endpoint — never render as 0. */
  estimated_total: string | null;
}

export interface Pagination {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListCustomerRequestsParams {
  status?: CustomerRequestStatus;
  customer?: number | string;
  rep?: number | string;
  page?: number;
}

export type CustomerRequestsListResponse = ApiEnvelope<{
  requests: CustomerRequest[];
  pagination: Pagination;
}>;

export type CustomerRequestResponse = ApiEnvelope<{
  request: CustomerRequestDetail;
}>;
