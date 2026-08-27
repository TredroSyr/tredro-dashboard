"use client";

import { useQuery } from "@tanstack/react-query";
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
  });
