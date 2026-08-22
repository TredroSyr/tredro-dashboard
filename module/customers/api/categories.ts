import api from "@/lib/axios";
import {
  CategoriesListResponse,
  CategoryResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ApiEnvelope,
} from "../types/categories";

export const listCategories = async (): Promise<CategoriesListResponse> => {
  const response = await api.get<CategoriesListResponse>(
    "companies/customer-categories/",
  );
  return response.data;
};

export const createCategory = async (
  payload: CreateCategoryPayload,
): Promise<CategoryResponse> => {
  const response = await api.post<CategoryResponse>(
    "companies/customer-categories/",
    payload,
  );
  return response.data;
};

export const updateCategory = async (
  payload: UpdateCategoryPayload,
): Promise<CategoryResponse> => {
  const { id, ...body } = payload;
  const response = await api.patch<CategoryResponse>(
    `companies/customer-categories/${id}/`,
    body,
  );
  return response.data;
};

export const deleteCategory = async (
  id: number,
): Promise<ApiEnvelope<null>> => {
  const response = await api.delete<ApiEnvelope<null>>(
    `companies/customer-categories/${id}/`,
  );
  return response.data;
};
