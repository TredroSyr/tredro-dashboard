"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useStockTransfersQuery = (params?: ListStockTransfersParams) =>
  useQuery({
    queryKey: ["stock-transfers", "list", params],
    queryFn: () => listStockTransfers(params),
  });

export const useStockTransferQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["stock-transfers", "detail", id],
    queryFn: () => getStockTransfer(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers", "list"] });
    },
  });
};

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
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
};

export const useCancelStockTransferMutation = () => {
  const invalidate = useInvalidateTransfer();
  return useMutation({
    mutationFn: (id: number | string) => cancelStockTransfer(id),
    onSuccess: (_data, id) => invalidate(id),
  });
};
