export interface AssignedRepDetail {
  id: number;
  name: string;
  phone: string;
  company_name?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  category: string | null;
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
  category?: string;
  assigned_reps?: number[];
  is_active?: boolean;
}

export interface UpdateCustomerPayload {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  category?: string;
  assigned_reps?: number[];
  is_active?: boolean;
}

export interface AssignRepsPayload {
  id: number;
  rep_ids: number[];
}

export interface RemoveRepsPayload {
  id: number;
  rep_ids?: number[];
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
export type ImportExcelResponse = ApiEnvelope<ImportExcelResult>;
