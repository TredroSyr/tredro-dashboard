export interface UnitOfMeasure {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  parent: number | null;
  parent_name: string | null;
  children_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  id: number;
  currency: number;
  currency_code: string;
  currency_symbol: string;
  price_type: string;
  customer_category: number | null;
  customer_category_name: string | null;
  price: string;
  is_default: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWarehouseStock {
  id: number;
  warehouse: number;
  warehouse_name: string;
  product: number;
  product_name: string;
  product_sku: string;
  quantity: string;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldDefinition {
  id: number;
  key: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  brand: string | null;
  category: number | null;
  category_name: string | null;
  unit: number;
  unit_name: string;
  is_active: boolean;
  is_sellable: boolean;
  is_purchasable: boolean;
  primary_image: { id: number; image: string; alt_text: string | null } | null;
  default_price: {
    price: string;
    currency_code: string;
    currency_symbol: string;
    price_type: string;
  } | null;
  created_at: string;
}

export interface ProductDetail
  extends Omit<Product, "primary_image" | "default_price"> {
  description: string | null;
  unit_code: string;
  weight: string | null;
  weight_unit: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  dimension_unit: string | null;
  reorder_point: string | null;
  reorder_quantity: string | null;
  is_taxable: boolean;
  tax_rate: string | null;
  external_reference: string | null;
  notes: string | null;
  images: ProductImage[];
  prices: ProductPrice[];
  custom_fields: Record<string, string>;
  updated_at: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type ProductsListResponse = ApiEnvelope<{ products: Product[] }>;
export type ProductResponse = ApiEnvelope<{ product: ProductDetail }>;
export type CategoriesResponse = ApiEnvelope<{ categories: ProductCategory[] }>;
export type UnitsResponse = ApiEnvelope<{ units: UnitOfMeasure[] }>;
export type CurrenciesResponse = ApiEnvelope<{ currencies: Currency[] }>;
export type ProductImagesResponse = ApiEnvelope<{ images: ProductImage[] }>;
export type CustomFieldDefinitionsResponse = ApiEnvelope<{
  definitions: CustomFieldDefinition[];
}>;
export type ProductCategoryResponse = ApiEnvelope<{
  category: ProductCategory;
}>;
export type CustomFieldDefinitionResponse = ApiEnvelope<{
  definition: CustomFieldDefinition;
}>;

export interface ProductImagePayload {
  image: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductPricePayload {
  currency: number;
  price_type: string;
  customer_category?: number | null;
  price: string;
  is_default?: boolean;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  category?: number | null;
  unit: number;
  weight?: string;
  weight_unit?: string;
  length?: string;
  width?: string;
  height?: string;
  dimension_unit?: string;
  reorder_point?: string;
  reorder_quantity?: string;
  is_taxable: boolean;
  tax_rate?: string;
  is_sellable: boolean;
  is_purchasable: boolean;
  external_reference?: string;
  notes?: string;
  is_active: boolean;
  status?: "draft" | "published";
  custom_fields?: Record<string, string>;
  images?: ProductImagePayload[];
  prices?: ProductPricePayload[];
}

export type UpdateProductPayload = Partial<CreateProductPayload> & {
  id: number;
};

export interface CreateProductCategoryPayload {
  name: string;
  parent?: number | null;
  is_active: boolean;
}

export interface CreateCustomFieldDefinitionPayload {
  key: string;
  label: string;
  is_active: boolean;
}

export interface DraftPrice extends ProductPricePayload {
  _localId: string;
  id?: number;
  currency_code?: string;
  currency_symbol?: string;
}

export interface DraftImage {
  _localId: string;
  file?: File;
  previewUrl: string;
  alt_text: string;
  is_primary: boolean;
}
