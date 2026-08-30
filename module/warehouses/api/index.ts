import api from "@/lib/axios";
import {
  ApiEnvelope,
  CreateWarehousePayload,
  ListWarehousesParams,
  UpdateWarehousePayload,
  WarehouseProductStockResponse,
  WarehouseResponse,
  WarehousesListResponse,
} from "../types";

export const listWarehouses = async (
  params?: ListWarehousesParams,
): Promise<WarehousesListResponse> =>
  (await api.get("companies/warehouses/", { params })).data;

export const getWarehouse = async (
  id: number | string,
): Promise<WarehouseResponse> =>
  (await api.get(`companies/warehouses/${id}/`)).data;

export const createWarehouse = async (
  payload: CreateWarehousePayload,
): Promise<WarehouseResponse> =>
  (await api.post("companies/warehouses/", payload)).data;

export const updateWarehouse = async (
  payload: UpdateWarehousePayload,
): Promise<WarehouseResponse> => {
  const { id, ...body } = payload;
  return (await api.patch(`companies/warehouses/${id}/`, body)).data;
};

/** Soft delete — sets is_active=false. Returns 200 with no data. */
export const deactivateWarehouse = async (
  id: number | string,
): Promise<ApiEnvelope<null>> =>
  (await api.delete(`companies/warehouses/${id}/`)).data;

export const getWarehouseProductStock = async (
  warehouseId: number | string,
): Promise<WarehouseProductStockResponse> =>
  (await api.get(`companies/warehouses/${warehouseId}/product-stock/`)).data;

export const getProductWarehouseStock = async (
  productId: number | string,
): Promise<WarehouseProductStockResponse> =>
  (await api.get(`companies/products/${productId}/warehouse-stock/`)).data;
