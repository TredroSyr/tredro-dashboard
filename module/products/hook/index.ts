"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  listUnits,
  listCurrencies,
  listCustomFieldDefinitions,
  createProductPrice,
  uploadProductImage,
} from "../api";
import {
  CreateProductPayload,
  UpdateProductPayload,
  CreateProductPricePayload,
} from "../types";

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

export const useUnitsQuery = () =>
  useQuery({ queryKey: ["units-of-measure"], queryFn: listUnits });

export const useCurrenciesQuery = () =>
  useQuery({ queryKey: ["currencies"], queryFn: listCurrencies });

export const useCustomFieldDefinitionsQuery = () =>
  useQuery({
    queryKey: ["custom-field-definitions"],
    queryFn: listCustomFieldDefinitions,
  });

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["products", "detail", variables.id],
        });
      }
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
    },
  });
};

export const useCreateProductPriceMutation = () =>
  useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: CreateProductPricePayload;
    }) => createProductPrice(productId, payload),
  });

export const useUploadProductImageMutation = () =>
  useMutation({
    mutationFn: ({
      productId,
      file,
      meta,
    }: {
      productId: number;
      file: File;
      meta: { alt_text?: string; is_primary?: boolean; sort_order?: number };
    }) => uploadProductImage(productId, file, meta),
  });
