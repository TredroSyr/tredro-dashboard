export type ModuleName =
  | "customers"
  | "invoices"
  | "orders"
  | "products"
  | "reps"
  | "stock_transfers"
  | "customer_requests"
  | "notifications"
  | "reports"
  | "billing"
  | "settings";

export interface ModuleOption {
  value: ModuleName;
  label: string;
  label_en: string;
}

export interface Permission {
  module: ModuleName;
  can_view: boolean;
  can_action: boolean;
}

export interface SubUser {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  is_owner: boolean;
  is_active: boolean;
  role_name: string | null;
  permissions: Permission[];
  created_at: string;
}

export interface CreateSubUserPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  permissions: Permission[];
}

export interface UpdateSubUserPayload {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  permissions?: Permission[];
}

// ---- API envelope types (match the doc's response shape) ----
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type ModulesResponse = ApiEnvelope<{ modules: ModuleOption[] }>;
export type SubUsersListResponse = ApiEnvelope<{ subusers: SubUser[] }>;
export type SubUserResponse = ApiEnvelope<{ subuser: SubUser }>;
export type CreateSubUserResponse = ApiEnvelope<{ subuser: SubUser }>;
export type UpdateSubUserResponse = ApiEnvelope<{ subuser: SubUser }>;
