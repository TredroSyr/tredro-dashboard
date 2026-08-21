export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  assigned_rep: number | null;
  assigned_rep_name: string | null;
  assigned_rep_phone: string | null;
  referral_code_used: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  password: string;
  email?: string;
  assigned_rep?: number;
  is_active?: boolean;
}

export interface UpdateCustomerPayload {
  id: number;
  name?: string;
  phone?: string;
  password?: string;
  email?: string;
  assigned_rep?: number | null;
  is_active?: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type CustomersListResponse = ApiEnvelope<{ customers: Customer[] }>;
export type CustomerResponse = ApiEnvelope<{ customer: Customer }>;
