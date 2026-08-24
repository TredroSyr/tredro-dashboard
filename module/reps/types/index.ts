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
