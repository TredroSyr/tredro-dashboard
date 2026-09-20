"use client";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
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

// After a save: refetch ALL products (even inactive queries) and the saved
// product by its id, so every screen shows fresh data.
const refreshProducts = async (
  queryClient: QueryClient,
  productId?: number | string,
) => {
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({
      queryKey: ["products"],
      refetchType: "all",
    }),
  ];
  if (productId) {
    tasks.push(
      queryClient.fetchQuery({
        queryKey: ["products", "detail", String(productId)],
        queryFn: () => getProduct(productId),
        staleTime: 0,
      }),
    );
  }
  await Promise.all(tasks);
};

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: async (data) => {
      await refreshProducts(queryClient, data.data?.product?.id);
      toast.success(data.message || "تمت إضافة المنتج بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة المنتج"),
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(payload),
    onSuccess: async (data, variables) => {
      await refreshProducts(
        queryClient,
        variables.id ?? data.data?.product?.id,
      );
      toast.success(data.message || "تم تحديث المنتج بنجاح");
    },
    onError: onErrorToast("تعذّر تحديث المنتج"),
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: async (data) => {
      await refreshProducts(queryClient);
      toast.success(data.message || "تم حذف المنتج بنجاح");
    },
    onError: onErrorToast("تعذّر حذف المنتج"),
  });
};
