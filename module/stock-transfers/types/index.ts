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

export type StockTransferStatus =
  | "pending"
  | "modified_by_admin"
  | "pending_rep_confirmation"
  | "confirmed"
  | "received"
  | "cancelled";

export interface StockTransferLine {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  unit: number;
  unit_name: string;
  requested_qty: string;
  approved_qty: string | null;
  /** approved_qty if set, otherwise requested_qty — render this one */
  effective_qty: string;
}

export interface StockTransfer {
  id: number;
  number: string;
  rep: number;
  rep_name: string;
  source_warehouse: number;
  source_warehouse_name: string;
  destination_warehouse: number;
  destination_warehouse_name: string;
  status: StockTransferStatus;
  requested_at: string;
  approved_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  lines?: StockTransferLine[];
}

export interface ListStockTransfersParams {
  status?: StockTransferStatus;
  rep?: number | string;
  search?: string;
  page?: number;
}

export type StockTransfersListResponse = ApiEnvelope<{
  transfers: StockTransfer[];
  pagination: Pagination;
}>;
export type StockTransferResponse = ApiEnvelope<{ transfer: StockTransfer }>;

export interface ModifyStockTransferLinePayload {
  line_id: number;
  approved_qty: string;
}

export interface ModifyStockTransferPayload {
  lines: ModifyStockTransferLinePayload[];
}

export interface CreateStockTransferLinePayload {
  product_id: number;
  quantity: string;
}

/** Office-initiated dispatch (frontend4.md §6d) — enters straight at `confirmed`, no idempotency key. */
export interface CreateStockTransferPayload {
  rep: number;
  lines: CreateStockTransferLinePayload[];
  source_warehouse?: number;
  destination_warehouse?: number;
  notes?: string;
}

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
