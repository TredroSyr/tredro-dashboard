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
  // Grants carried on the login payload. Fallback for staff whose role lacks
  // `users` — GET /companies/subusers/{id} answers 403 for them, so their own
  // permissions can't always be read from that endpoint.
  const loginPermissions = useAuthStore((state) => state.user?.permissions);

  const {
    data: subUserData,
    isLoading: queryLoading,
    refetch,
  } = usePermissionsQuery(userIsOwner ? undefined : userId);

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
