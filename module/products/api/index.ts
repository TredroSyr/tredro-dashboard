import api from "@/lib/axios";
import {
  ProductsListResponse,
  ProductResponse,
  CategoriesResponse,
  UnitsResponse,
  CurrenciesResponse,
  CustomFieldDefinitionsResponse,
  ProductImageResponse,
  ProductPriceResponse,
  CreateProductPayload,
  UpdateProductPayload,
  CreateProductPricePayload,
  ApiEnvelope,
} from "../types";

// ---- Lookups ----
export const listCategories = async (): Promise<CategoriesResponse> =>
  (
    await api.get("companies/product-categories/", {
      params: { is_active: true },
    })
  ).data;

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

// ---- Products ----
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

// ---- Nested: Prices ----
export const createProductPrice = async (
  productId: number,
  payload: CreateProductPricePayload,
): Promise<ProductPriceResponse> =>
  (await api.post(`companies/products/${productId}/prices/`, payload)).data;

// ---- Nested: Images ----
export const uploadProductImage = async (
  productId: number,
  file: File,
  meta: { alt_text?: string; is_primary?: boolean; sort_order?: number },
): Promise<ProductImageResponse> => {
  const form = new FormData();
  form.append("image", file);
  if (meta.alt_text) form.append("alt_text", meta.alt_text);
  if (meta.is_primary !== undefined)
    form.append("is_primary", String(meta.is_primary));
  if (meta.sort_order !== undefined)
    form.append("sort_order", String(meta.sort_order));

  return (
    await api.post(`companies/products/${productId}/images/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};
