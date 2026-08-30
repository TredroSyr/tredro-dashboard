"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse,
  getWarehouseProductStock,
  getProductWarehouseStock,
} from "../api";
import {
  CreateWarehousePayload,
  ListWarehousesParams,
  UpdateWarehousePayload,
} from "../types";

export const useWarehousesQuery = (params?: ListWarehousesParams) =>
  useQuery({
    queryKey: ["warehouses", "list", params],
    queryFn: () => listWarehouses(params),
  });

export const useWarehouseQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["warehouses", "detail", id],
    queryFn: () => getWarehouse(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "list"] });
    },
  });
};

export const useUpdateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWarehousePayload) => updateWarehouse(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["warehouses", "detail", variables.id],
      });
    },
  });
};

export const useDeactivateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deactivateWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "list"] });
    },
  });
};

export const useWarehouseProductStockQuery = (
  warehouseId?: number | string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["warehouses", "product-stock", warehouseId],
    queryFn: () => getWarehouseProductStock(warehouseId as number | string),
    enabled: (options?.enabled ?? true) && Boolean(warehouseId),
  });

export const useProductWarehouseStockQuery = (
  productId?: number | string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["products", "warehouse-stock", productId],
    queryFn: () => getProductWarehouseStock(productId as number | string),
    enabled: (options?.enabled ?? true) && Boolean(productId),
  });
