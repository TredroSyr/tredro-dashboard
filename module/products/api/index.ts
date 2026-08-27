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

/**
 * New contract (see integration spec):
 * - One "data" part: JSON.stringify(payload) with real nested arrays/objects
 *   (no bracket notation).
 * - Each new image file gets its own form field (image_0, image_1, ...),
 *   referenced from payload.images[i]._file_ref.
 * - Existing images being updated in place just carry their `id`
 *   (no _file_ref, no file).
 * - Rows with neither a File nor an existing id/url are dropped before
 *   building the payload — sending them causes
 *   "images.0.image: No file was submitted".
 * - Price rows missing currency/price are dropped — sending them causes
 *   "This field is required."
 */

interface ProductImageInput {
  id?: number;
  file?: File;
  url?: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

interface ProductPriceInput {
  id?: number;
  currency?: number | string | null;
  price_type?: string;
  customer_category?: number | string | null;
  price?: number | string | null;
  is_default?: boolean;
}

const sanitizeImages = (images: ProductImageInput[] = []) =>
  images.filter(
    (img) => img.file instanceof File || Boolean(img.url) || Boolean(img.id),
  );

const sanitizePrices = (prices: ProductPriceInput[] = []) =>
  prices.filter(
    (price) =>
      price.currency !== undefined &&
      price.currency !== null &&
      price.currency !== "" &&
      price.price !== undefined &&
      price.price !== null &&
      price.price !== "",
  );

/**
 * Builds the multipart FormData: one JSON "data" part + one file part
 * per new image, wired together via `_file_ref`.
 */
const buildProductFormData = (
  payload: Record<string, unknown>,
): FormData => {
  const formData = new FormData();

  const rawImages = (payload.images as ProductImageInput[] | undefined) ?? [];
  const cleanedImages = sanitizeImages(rawImages);

  const imagesForPayload = cleanedImages.map((img, index) => {
    const { file, ...rest } = img;
    if (file instanceof File) {
      const fileRef = `image_${index}`;
      formData.append(fileRef, file);
      return { ...rest, _file_ref: fileRef, sort_order: index };
    }
    // existing image, no new file: keep id/url so backend knows it's untouched
    return { ...rest, sort_order: index };
  });

  const rawPrices = (payload.prices as ProductPriceInput[] | undefined) ?? [];
  const pricesForPayload = sanitizePrices(rawPrices);

  const dataPayload = {
    ...payload,
    images: rawImages.length > 0 ? imagesForPayload : undefined,
    prices: rawPrices.length > 0 ? pricesForPayload : undefined,
  };

  // status is not writable on this endpoint yet — don't send it
  delete (dataPayload as Record<string, unknown>).status;

  formData.append("data", JSON.stringify(dataPayload));

  return formData;
};

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<ProductResponse> => {
  const formData = buildProductFormData(
    payload as unknown as Record<string, unknown>,
  );
  return (
    await api.post("companies/products/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};

export const updateProduct = async (
  payload: UpdateProductPayload,
): Promise<ProductResponse> => {
  const { id, ...body } = payload;
  const formData = buildProductFormData(
    body as unknown as Record<string, unknown>,
  );
  return (
    await api.patch(`companies/products/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};

export const deleteProduct = async (id: number): Promise<ApiEnvelope<null>> =>
  (await api.delete(`companies/products/${id}/`)).data;