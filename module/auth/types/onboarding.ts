export interface GovernorateLocation {
  governorate: string;
  regions: string[];
}

export interface BusinessType {
  value: string;
  label: string;
}

export interface OnboardingPayload {
  logo?: File | null;
  cover?: File | null;
  governorate?: string;
  region?: string;
  description?: string;
  business_type?: string;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}
