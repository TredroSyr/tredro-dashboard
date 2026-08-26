import api from "@/lib/axios";
import {
  ProductsListResponse,
  ProductResponse,
  CategoriesResponse,
  UnitsResponse,
  CurrenciesResponse,
  CustomFieldDefinitionsResponse,
  CreateProductPayload,
  UpdateProductPayload,
  CreateProductCategoryPayload,
  CreateCustomFieldDefinitionPayload,
  ProductCategoryResponse,
  CustomFieldDefinitionResponse,
  ApiEnvelope,
} from "../types";

export const listCategories = async (): Promise<CategoriesResponse> =>
  (
    await api.get("companies/product-categories/", {
      params: { is_active: true },
    })
  ).data;

export const createCategory = async (
  payload: CreateProductCategoryPayload,
): Promise<ProductCategoryResponse> =>
  (await api.post("companies/product-categories/", payload)).data;

export const listUnits = async (): Promise<UnitsResponse> =>
  (await api.get("units-of-measure/")).data;

export const listCurrencies = async (): Promise<CurrenciesResponse> =>
  (await api.get("currencies/")).data;

export const listCustomFieldDefinitions =
  async (): Promise<CustomFieldDefinitionsResponse> =>
    (
      await api.get("companies/custom-field-definitions/", {
        params: { is_active: true },
      })
    ).data;

export const createCustomFieldDefinition = async (
  payload: CreateCustomFieldDefinitionPayload,
): Promise<CustomFieldDefinitionResponse> =>
  (await api.post("companies/custom-field-definitions/", payload)).data;

export const listProducts = async (params?: {
  search?: string;
  category?: number;
  is_active?: boolean;
}): Promise<ProductsListResponse> =>
  (await api.get("companies/products/", { params })).data;

export const getProduct = async (
  id: number | string,
): Promise<ProductResponse> =>
  (await api.get(`companies/products/${id}/`)).data;

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<ProductResponse> =>
  (await api.post("companies/products/", payload)).data;

export const updateProduct = async (
  payload: UpdateProductPayload,
): Promise<ProductResponse> => {
  const { id, ...body } = payload;
  return (await api.patch(`companies/products/${id}/`, body)).data;
};

export const deleteProduct = async (id: number): Promise<ApiEnvelope<null>> =>
  (await api.delete(`companies/products/${id}/`)).data;
