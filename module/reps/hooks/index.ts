"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listReps, getRep, createRep, updateRep, deleteRep } from "../api";
import { CreateRepPayload, UpdateRepPayload } from "../types";

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
    onSuccess: () => {
      // بس اللستة، ما إلها علاقة بـ detail queries
      queryClient.invalidateQueries({ queryKey: ["reps", "list"] });
    },
  });
};

export const useUpdateRepMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRepPayload) => updateRep(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reps", "list"] });
      // إذا بدك كمان تحدّث الـ detail cache لنفس المندوب
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["reps", "detail", variables.id] });
      }
    },
  });
};

export const useDeleteRepMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRep(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reps", "list"] });
    },
  });
};