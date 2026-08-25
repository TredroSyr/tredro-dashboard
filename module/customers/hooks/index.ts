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
  bulkAction,
  importCustomersExcel,
} from "../api";
import {
  CreateCustomerPayload,
  UpdateCustomerPayload,
  AssignRepsPayload,
  RemoveRepsPayload,
  BulkActionPayload,
} from "../types";

export const useCustomersQuery = (repId?: string | number) =>
  useQuery({
    queryKey: ["customers", "list", repId],
    queryFn: () => listCustomers(repId),
  });

export const useCustomerQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => {
      if (!id) throw new Error("getCustomer called without id");
      return getCustomer(id);
    },
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) => updateCustomer(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["customers", "detail", variables.id],
        });
      }
    },
  });
};

export const useDeactivateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
    },
  });
};

export const useAssignRepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRepsPayload) => assignRepsToCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
};

export const useRemoveRepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveRepsPayload) => removeRepsFromCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
};

export const useBulkActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) => bulkAction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
};

export const useImportCustomersExcelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importCustomersExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
};