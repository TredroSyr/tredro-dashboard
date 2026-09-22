"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getMySubUser } from "@/module/users/api";

// userId is only here to key the cache per account and gate `enabled` — the
// request itself hits /companies/subusers/me, which needs no id.
export const usePermissionsQuery = (userId?: number) =>
  useQuery({
    queryKey: ["permissions", "me", userId],
    queryFn: () => getMySubUser(),
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    // A 403 here is a real answer, not a transient failure — retrying it
    // would just hold the permissions gate open longer than it should.
    retry: (failureCount, error) =>
      !(isAxiosError(error) && error.response?.status === 403) &&
      failureCount < 2,
  });
