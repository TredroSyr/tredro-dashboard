export interface Category {
  id: number;
  name: string;
  is_global: boolean;
  is_custom: boolean;
  created_at: string;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  id: number;
  name: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type CategoriesListResponse = ApiEnvelope<{ categories: Category[] }>;
export type CategoryResponse = ApiEnvelope<{ category: Category }>;
