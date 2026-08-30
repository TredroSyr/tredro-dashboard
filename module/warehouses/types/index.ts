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
  product: number;
  product_name: string;
  product_sku: string;
  /** decimal string, 3 decimals, in the product's unit of measure */
  quantity: string;
  created_at: string;
  updated_at: string;
}

export type WarehouseProductStockResponse = ApiEnvelope<{
  stock: WarehouseProductStockRow[];
}>;
