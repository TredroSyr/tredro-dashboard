"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import {
  getModules,
  listSubUsers,
  getSubUser,
  createSubUser,
  updateSubUser,
  deleteSubUser,
} from "../api";
import { CreateSubUserPayload, UpdateSubUserPayload, SubUser } from "../types";
import { ApiErrorResponse } from "@/module/auth/types";

export const useModulesQuery = () =>
  useQuery({
    queryKey: ["modules"],
    queryFn: getModules,
    staleTime: Infinity, // static list, rarely changes
  });

export const useSubUsersQuery = () =>
  useQuery({
    queryKey: ["subusers"],
    queryFn: listSubUsers,
  });

export const useSubUserQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["subusers", id],
    queryFn: () => getSubUser(Number(id)),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateSubUserMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubUserPayload) => createSubUser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subusers"] });
      toast.success(data.message || "تم إنشاء المستخدم بنجاح");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.response?.data?.message || "فشل إنشاء المستخدم");
      }
    },
  });
};

export const useUpdateSubUserMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSubUserPayload) => updateSubUser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subusers"] });
      toast.success(data.message || "تم تحديث المستخدم بنجاح");
      options?.onSuccess?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.response?.data?.message || "فشل تحديث المستخدم");
      }
    },
  });
};

export const useDeleteSubUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSubUser(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subusers"] });
      toast.success(data.message || "تم حذف المستخدم بنجاح");
    },
    onError: (error: AxiosError<ApiErrorResponse>) =>
      toast.error(error.response?.data?.message || "فشل حذف المستخدم"),
  });
};
