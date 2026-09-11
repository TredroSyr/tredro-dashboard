"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
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

const onErrorToast = (fallback: string) => (error: AxiosError<ApiErrorResponse>) => {
  toast.error(error.response?.data?.message || fallback);
};

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      toast.success(data.message || "تمت إضافة العميل بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة العميل"),
  });
};

export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) => updateCustomer(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["customers", "detail", variables.id],
        });
      }
      toast.success(data.message || "تم تحديث العميل بنجاح");
    },
    onError: onErrorToast("تعذّر تحديث العميل"),
  });
};

export const useDeactivateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
      toast.success(data.message || "تم تعطيل العميل بنجاح");
    },
    onError: onErrorToast("تعذّر تعطيل العميل"),
  });
};

export const useAssignRepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRepsPayload) => assignRepsToCustomer(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      // Same endpoint is reused to update visit days for an already-assigned
      // rep — that's not a (re)assignment, so it gets its own message
      // instead of the backend's generic "rep assigned" text.
      toast.success(
        variables.visitDaysOnly
          ? "تم تحديث أيام الزيارة بنجاح"
          : data.message || "تم تعيين المندوب بنجاح",
      );
    },
    onError: (error: AxiosError<ApiErrorResponse>, variables) => {
      toast.error(
        error.response?.data?.message ||
          (variables.visitDaysOnly
            ? "تعذّر تحديث أيام الزيارة"
            : "تعذّر تعيين المندوب"),
      );
    },
  });
};

export const useRemoveRepsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveRepsPayload) => removeRepsFromCustomer(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      toast.success(data.message || "تمت إزالة المندوب بنجاح");
    },
    onError: onErrorToast("تعذّر إزالة المندوب"),
  });
};

export const useBulkActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) => bulkAction(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      toast.success(data.message || "تم تنفيذ الإجراء بنجاح");
    },
    onError: onErrorToast("تعذّر تنفيذ الإجراء"),
  });
};

export const useImportCustomersExcelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importCustomersExcel(file),
    // No generic error toast here — callers (import-excel-dialog,
    // failed-rows-editor) render their own detailed row-by-row error UI.
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      toast.success(data.message || "تم استيراد الملف بنجاح");
    },
  });
};