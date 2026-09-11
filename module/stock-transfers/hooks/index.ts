"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  listStockTransfers,
  getStockTransfer,
  createStockTransfer,
  approveStockTransfer,
  modifyStockTransfer,
  cancelStockTransfer,
  getStockTransferHistory,
} from "../api";
import {
  CreateStockTransferPayload,
  ListStockTransfersParams,
  ModifyStockTransferPayload,
} from "../types";

const onErrorToast = (fallback: string) => (error: AxiosError<ApiErrorResponse>) => {
  toast.error(error.response?.data?.message || fallback);
};

export const useStockTransfersQuery = (
  params?: ListStockTransfersParams,
  refetchInterval?: number,
) =>
  useQuery({
    queryKey: ["stock-transfers", "list", params],
    queryFn: () => listStockTransfers(params),
    refetchInterval,
  });

export const useStockTransferQuery = (
  id?: string | number,
  options?: { enabled?: boolean; refetchInterval?: number },
) =>
  useQuery({
    queryKey: ["stock-transfers", "detail", id],
    queryFn: () => getStockTransfer(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
    refetchInterval: options?.refetchInterval,
  });

export const useStockTransferHistoryQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["stock-transfers", "history", id],
    queryFn: () => getStockTransferHistory(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

function useInvalidateTransfer() {
  const queryClient = useQueryClient();
  return (id: number | string) => {
    queryClient.invalidateQueries({ queryKey: ["stock-transfers", "list"] });
    queryClient.invalidateQueries({
      queryKey: ["stock-transfers", "detail", id],
    });
    queryClient.invalidateQueries({
      queryKey: ["stock-transfers", "history", id],
    });
  };
}

export const useCreateStockTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockTransferPayload) =>
      createStockTransfer(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers", "list"] });
      toast.success(data.message || "تم إنشاء طلب النقل بنجاح");
    },
    onError: onErrorToast("تعذّر إنشاء طلب النقل"),
  });
};

// Approve/cancel already show their own toast at the call site (with a
// refetch alongside it), so no automatic toast here to avoid double-firing.
export const useApproveStockTransferMutation = () => {
  const invalidate = useInvalidateTransfer();
  return useMutation({
    mutationFn: (id: number | string) => approveStockTransfer(id),
    onSuccess: (_data, id) => invalidate(id),
  });
};

export const useModifyStockTransferMutation = () => {
  const invalidate = useInvalidateTransfer();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ModifyStockTransferPayload;
    }) => modifyStockTransfer(id, payload),
    onSuccess: (data, variables) => {
      invalidate(variables.id);
      toast.success(data.message || "تم تعديل طلب النقل بنجاح");
    },
    onError: onErrorToast("تعذّر تعديل طلب النقل"),
  });
};

export const useCancelStockTransferMutation = () => {
  const invalidate = useInvalidateTransfer();
  return useMutation({
    mutationFn: (id: number | string) => cancelStockTransfer(id),
    onSuccess: (_data, id) => invalidate(id),
  });
};
