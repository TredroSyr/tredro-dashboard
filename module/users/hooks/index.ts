"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModules,
  listSubUsers,
  createSubUser,
  updateSubUser,
  deleteSubUser,
} from "../api";
import { CreateSubUserPayload, UpdateSubUserPayload, SubUser } from "../types";

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

// NOTE: no dedicated "get sub-user by id" endpoint is documented in api.ts.
// This derives the single sub-user from the already-fetched list cache
// instead of firing a new network call. If a real
// GET companies/subusers/:id endpoint gets added later, swap the
// queryFn below to call it directly with queryKey: ["subusers", id].
export const useSubUserQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["subusers"],
    queryFn: listSubUsers,
    enabled: (options?.enabled ?? true) && Boolean(id),
    select: (response) => {
      const subusers = response.data.subusers as SubUser[];
      const found = subusers.find((u) => String(u.id) === String(id));
      return { ...response, data: found as SubUser };
    },
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
