"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import { listReps, getRep, createRep, updateRep, deleteRep } from "../api";
import { CreateRepPayload, UpdateRepPayload } from "../types";

const onErrorToast = (fallback: string) => (error: AxiosError<ApiErrorResponse>) => {
  toast.error(error.response?.data?.message || fallback);
};

export const useRepsQuery = (customerId?: string | number) =>
  useQuery({
    queryKey: ["reps", "list", customerId],
    queryFn: () => listReps(customerId),
  });

export const useRepQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["reps", "detail", id],
    queryFn: () => getRep(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateRepMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRepPayload) => createRep(payload),
    onSuccess: (data) => {
      // بس اللستة، ما إلها علاقة بـ detail queries
      queryClient.invalidateQueries({ queryKey: ["reps", "list"] });
      toast.success(data.message || "تمت إضافة المندوب بنجاح");
    },
    onError: onErrorToast("تعذّرت إضافة المندوب"),
  });
};

export const useUpdateRepMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRepPayload) => updateRep(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reps", "list"] });
      // إذا بدك كمان تحدّث الـ detail cache لنفس المندوب
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["reps", "detail", variables.id] });
      }
      toast.success(data.message || "تم تحديث المندوب بنجاح");
    },
    onError: onErrorToast("تعذّر تحديث المندوب"),
  });
};

export const useDeleteRepMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRep(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reps", "list"] });
      toast.success(data.message || "تم حذف المندوب بنجاح");
    },
    onError: onErrorToast("تعذّر حذف المندوب"),
  });
};