"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["custom-field-definitions"],
      });
    },
  });
};

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
