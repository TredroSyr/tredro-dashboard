export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type WarehouseOwnerType = "company" | "rep";

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  kind: string;
  owner_type: WarehouseOwnerType;
  rep: number | null;
  rep_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListWarehousesParams {
  is_active?: boolean;
  owner_type?: WarehouseOwnerType;
}

export type WarehousesListResponse = ApiEnvelope<{ warehouses: Warehouse[] }>;
export type WarehouseResponse = ApiEnvelope<{ warehouse: Warehouse }>;

export interface CreateWarehousePayload {
  name: string;
  address?: string;
  kind?: string;
  owner_type: WarehouseOwnerType;
  rep?: number | null;
  is_active?: boolean;
}

export interface UpdateWarehousePayload {
  id: number;
  name?: string;
  address?: string;
  kind?: string;
  owner_type?: WarehouseOwnerType;
  rep?: number | null;
  is_active?: boolean;
}

export interface WarehouseProductStockRow {
  id: number;
  warehouse: number;
  warehouse_name: string;
  warehouse_kind: string;
  warehouse_owner_type: WarehouseOwnerType;
  warehouse_is_active: boolean;
  rep: number | null;
  rep_name: string | null;
  product: number;
  product_name: string;
  product_image: string | null;
  product_sku: string;
  product_barcode: string;
  product_is_active: boolean;
  unit: number;
  unit_name: string;
  unit_code: string;
  /** decimal string, 3 decimals, in the product's unit of measure */
  quantity: string;
  /** decimal string threshold below which the product is considered low stock in this warehouse — null means no threshold set */
  reorder_point: string | null;
  /** null when no reorder_point is set, so "low stock" can't be evaluated */
  is_low_stock: boolean | null;
  created_at: string;
  updated_at: string;
}

export type WarehouseProductStockResponse = ApiEnvelope<{
  stock: WarehouseProductStockRow[];
}>;
