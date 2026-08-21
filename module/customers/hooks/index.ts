"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  assignRepsToCustomer,
  removeRepsFromCustomer,
  importCustomersExcel,
} from "../api";
import {
  CreateCustomerPayload,
  UpdateCustomerPayload,
  AssignRepsPayload,
  RemoveRepsPayload,
} from "../types";

export const useCustomersQuery = () =>
  useQuery({
    queryKey: ["customers"],
    queryFn: listCustomers,
  });

export const useCustomerQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomer(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) => updateCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useDeactivateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useAssignRepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRepsPayload) => assignRepsToCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useRemoveRepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveRepsPayload) => removeRepsFromCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useImportCustomersExcelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importCustomersExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
