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
