"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getSubUser } from "@/module/users/api";

export const usePermissionsQuery = (userId?: number) =>
  useQuery({
    queryKey: ["permissions", userId],
    queryFn: () => {
      if (!userId) throw new Error("No user ID");
      return getSubUser(userId);
    },
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    // A 403 here is a real answer (the role has no `users` grant), not a
    // transient failure — retrying it would hold the permissions gate open.
    retry: (failureCount, error) =>
      !(isAxiosError(error) && error.response?.status === 403) &&
      failureCount < 2,
  });
