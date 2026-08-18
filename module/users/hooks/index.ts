"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModules,
  listSubUsers,
  createSubUser,
  updateSubUser,
  deleteSubUser,
} from "../api";
import { CreateSubUserPayload, UpdateSubUserPayload } from "../types";

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

export const useCreateSubUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubUserPayload) => createSubUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subusers"] });
    },
  });
};

export const useUpdateSubUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSubUserPayload) => updateSubUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subusers"] });
    },
  });
};

export const useDeleteSubUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSubUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subusers"] });
    },
  });
};
