"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { ModuleName, Permission, SubUserResponse } from "@/module/users/types";

import {
  PermissionsMap,
  buildFullAccessMap,
  normalizePermissions,
} from "@/module/users/lib/permissions-map";
import { usePermissionsQuery } from "@/module/users/hooks/permssions";

interface PermissionsContextValue {
  permissions: PermissionsMap;
  isLoading: boolean;
  isOwner: boolean;
  rawPermissions: Permission[];
  /** The signed-in account's name, straight from GET /companies/subusers/me — not the login payload. */
  accountName: string | null;
  /** The signed-in sub-user's role name (§5.1) — absent for owners, who have no role. */
  roleName: string | null;
  /**
   * Whether that fetch is still in flight — unlike `isLoading` (which only
   * gates staff, since owners already have full access without it), this is
   * true for owners too while their name/role are still loading.
   */
  isAccountLoading: boolean;
  canView: (module: ModuleName) => boolean;
  canAction: (module: ModuleName) => boolean;
  refetch: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const userIsOwner = useAuthStore((state) => !!state.user?.is_owner);
  // Grants carried on the login payload. Fallback for whenever
  // /companies/subusers/me hasn't resolved yet or fails — permissions can't
  // always be read from that endpoint.
  const loginPermissions = useAuthStore((state) => state.user?.permissions);

  // Fetched for owners too (not just staff) — the account badge's name/role
  // come from this record rather than the login payload.
  const {
    data: subUserData,
    isLoading: queryLoading,
    refetch,
  } = usePermissionsQuery(userId);

  const subUser = (subUserData as SubUserResponse | undefined)?.data?.subuser;
  const isOwner = userIsOwner || !!subUser?.is_owner;

  // Derived, not stored: an effect-fed state leaves one render where loading
  // has finished but the map is still empty, which reads as "no access".
  const permissionsMap = useMemo<PermissionsMap>(() => {
    if (isOwner) return buildFullAccessMap();
    if (subUser) return normalizePermissions(subUser.permissions);
    return normalizePermissions(loginPermissions as PermissionsMap | undefined);
  }, [isOwner, subUser, loginPermissions]);

  const rawPermissions = useMemo<Permission[]>(
    () => (isOwner ? [] : (subUser?.permissions ?? [])),
    [isOwner, subUser],
  );

  const accountName = subUser?.name ?? null;
  const roleName = isOwner ? null : (subUser?.role_name ?? null);

  const canView = useCallback(
    (module: ModuleName): boolean => {
      if (isOwner) return true;
      return permissionsMap[module]?.can_view ?? false;
    },
    [permissionsMap, isOwner],
  );

  const canAction = useCallback(
    (module: ModuleName): boolean => {
      if (isOwner) return true;
      const perm = permissionsMap[module];
      return perm?.can_view === true && perm?.can_action === true;
    },
    [permissionsMap, isOwner],
  );

  const contextValue: PermissionsContextValue = {
    permissions: permissionsMap,
    isLoading: !userIsOwner && queryLoading,
    isOwner,
    rawPermissions,
    accountName,
    roleName,
    isAccountLoading: queryLoading,
    canView,
    canAction,
    refetch,
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error(
      "usePermissions() must be used within a PermissionsProvider. " +
        "Make sure PermissionsProvider wraps your component tree.",
    );
  }

  return context;
}
