export interface RegisterCredentials {
  company_name: string;
  phone: string;
  password: string;
  password_confirm: string;
  currency?: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  logo?: string | null;
  cover?: string | null;
  governorate?: string | null;
  region?: string | null;
  description?: string | null;
  business_type?: string | null;
  onboarding_completed: boolean;
  onboarding_completed_at?: string | null;
}

export interface Permissions {
  products: { can_view: boolean; can_action: boolean };
  orders: { can_view: boolean; can_action: boolean };
  customers: { can_view: boolean; can_action: boolean };
  invoices: { can_view: boolean; can_action: boolean };
  billing: { can_view: boolean; can_action: boolean };
  reps: { can_view: boolean; can_action: boolean };
  notifications: { can_view: boolean; can_action: boolean };
  reports: { can_view: boolean; can_action: boolean };
  settings: { can_view: boolean; can_action: boolean };
}

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  is_owner: boolean;
  is_active: boolean;
  role: string | null;
  company: Company;
  permissions?: Permissions;
  created_at: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface AuthResponseData {
  company?: Company;
  user: AuthUser;
  tokens: Tokens;
}

export interface AuthApiResponse {
  success: boolean;
  message: string;
  data: AuthResponseData;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
