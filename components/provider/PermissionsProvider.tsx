"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { ModuleName, Permission, SubUserResponse } from "@/module/users/types";

import {
  PermissionsMap,
  buildFullAccessMap,
  permissionsArrayToMap,
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
  const userIsOwner = useAuthStore((state) => state.user?.is_owner);

  const [permissionsMap, setPermissionsMap] = useState<PermissionsMap>({});
  const [isOwner, setIsOwner] = useState(false);
  const [rawPermissions, setRawPermissions] = useState<Permission[]>([]);

  const {
    data: subUserData,
    isLoading: queryLoading,
    refetch,
  } = usePermissionsQuery(userId);

  useEffect(() => {
    if (userIsOwner) {
      setPermissionsMap(buildFullAccessMap());
      setIsOwner(true);
      setRawPermissions([]);
      return;
    }

    if (subUserData) {
      const subUser = (subUserData as SubUserResponse)?.data?.subuser;

      if (subUser) {
        setPermissionsMap(permissionsArrayToMap(subUser.permissions));
        setIsOwner(subUser.is_owner);
        setRawPermissions(subUser.permissions);
      }
    }
  }, [subUserData, userIsOwner]);

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
    isLoading: queryLoading,
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
