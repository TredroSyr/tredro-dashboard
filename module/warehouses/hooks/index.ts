"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
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

const onErrorToast = (fallback: string) => (error: AxiosError<ApiErrorResponse>) => {
  toast.error(error.response?.data?.message || fallback);
};

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "list"] });
      toast.success(data.message || "تمت إضافة المستودع بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة المستودع"),
  });
};

export const useUpdateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWarehousePayload) => updateWarehouse(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["warehouses", "detail", variables.id],
      });
      toast.success(data.message || "تم تحديث المستودع بنجاح");
    },
    onError: onErrorToast("تعذّر تحديث المستودع"),
  });
};

// Deactivate already shows its own error toast at the call site — only add
// the success toast here to avoid double-firing on failure.
export const useDeactivateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deactivateWarehouse(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", "list"] });
      toast.success(data.message || "تم تعطيل المستودع بنجاح");
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
