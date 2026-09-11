"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  listUnits,
  listCurrencies,
  listCustomFieldDefinitions,
  createCustomFieldDefinition,
} from "../api";
import {
  CreateProductPayload,
  UpdateProductPayload,
  CreateProductCategoryPayload,
  CreateCustomFieldDefinitionPayload,
} from "../types";

const onErrorToast = (fallback: string) => (error: AxiosError<ApiErrorResponse>) => {
  toast.error(error.response?.data?.message || fallback);
};

export const useProductsQuery = (params?: {
  search?: string;
  category?: number;
}) =>
  useQuery({
    queryKey: ["products", "list", params],
    queryFn: () => listProducts(params),
  });

export const useProductQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => getProduct(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCategoriesQuery = () =>
  useQuery({ queryKey: ["product-categories"], queryFn: listCategories });

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductCategoryPayload) =>
      createCategory(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success(data.message || "تمت إضافة التصنيف بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة التصنيف"),
  });
};

export const useUnitsQuery = () =>
  useQuery({ queryKey: ["units-of-measure"], queryFn: listUnits });

export const useCurrenciesQuery = () =>
  useQuery({ queryKey: ["currencies"], queryFn: listCurrencies });

export const useCustomFieldDefinitionsQuery = () =>
  useQuery({
    queryKey: ["custom-field-definitions"],
    queryFn: listCustomFieldDefinitions,
  });

export const useCreateCustomFieldDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomFieldDefinitionPayload) =>
      createCustomFieldDefinition(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["custom-field-definitions"],
      });
      toast.success(data.message || "تمت إضافة الحقل المخصص بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة الحقل المخصص"),
  });
};

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      toast.success(data.message || "تمت إضافة المنتج بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة المنتج"),
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["products", "detail", variables.id],
        });
      }
      toast.success(data.message || "تم تحديث المنتج بنجاح");
    },
    onError: onErrorToast("تعذّر تحديث المنتج"),
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      toast.success(data.message || "تم حذف المنتج بنجاح");
    },
    onError: onErrorToast("تعذّر حذف المنتج"),
  });
};
