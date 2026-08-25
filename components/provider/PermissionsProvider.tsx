"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getSubUser } from "@/module/users/api";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { ModuleName, Permission, SubUserResponse } from "@/module/users/types";

// ==========================================
// Types
// ==========================================

/**
 * Permissions map for O(1) lookups
 * Stored as: { customers: { can_view: boolean, can_action: boolean }, ... }
 */
export type PermissionsMap = {
  [module in ModuleName]?: {
    can_view: boolean;
    can_action: boolean;
  };
};

/**
 * Context value exposed by PermissionsProvider
 */
interface PermissionsContextValue {
  // State
  permissions: PermissionsMap;
  isLoading: boolean;
  isOwner: boolean;
  rawPermissions: Permission[];

  // Helper methods
  canView: (module: ModuleName) => boolean;
  canAction: (module: ModuleName) => boolean;
  refetch: () => void;
}

// ==========================================
// Context
// ==========================================

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// ==========================================
// Helper: Convert API response to PermissionsMap
// ==========================================

function permissionsArrayToMap(permissions: Permission[]): PermissionsMap {
  const map: PermissionsMap = {};

  // Initialize all modules with false (conservative default)
  const allModules: ModuleName[] = [
    "customers",
    "invoices",
    "orders",
    "products",
    "reps",
    "notifications",
  ];

  allModules.forEach((module) => {
    map[module] = { can_view: false, can_action: false };
  });

  // Override with actual permissions from API
  permissions.forEach((perm) => {
    map[perm.module] = {
      can_view: perm.can_view,
      can_action: perm.can_action,
    };
  });

  return map;
}

// ==========================================
// Provider Component
// ==========================================

interface PermissionsProviderProps {
  children: ReactNode;
}

/**
 * PermissionsProvider
 * 
 * Fetches permissions on mount (no long-term caching) and provides
 * them via Context to all child components.
 * 
 * Place this INSIDE the protected route / protected layout so it only
 * fetches when user is authenticated.
 * 
 * Data Flow:
 * 1. Component mounts
 * 2. useQuery fetches from GET /companies/subusers/:id
 * 3. API returns { subuser: { permissions: [...], is_owner: boolean } }
 * 4. State updates: permissionsMap + isLoading = false
 * 5. Children re-render with new context value
 * 
 * Usage in root layout:
 * <PermissionsProvider>
 *   <App />
 * </PermissionsProvider>
 */
export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const userIsOwner = useAuthStore((state) => state.user?.is_owner);

  // Local state for permissions (React Context, not Zustand)
  const [permissionsMap, setPermissionsMap] = useState<PermissionsMap>({});
  const [isOwner, setIsOwner] = useState(false);
  const [rawPermissions, setRawPermissions] = useState<Permission[]>([]);

  // Fetch permissions from API on every mount (no caching per requirements)
  const {
    data: subUserData,
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: ["permissions", userId],
    queryFn: () => {
      if (!userId) throw new Error("No user ID");
      return getSubUser(userId);
    },
    enabled: Boolean(userId),
    // No caching - fetch fresh on every mount
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  // Process API response when it arrives
  useEffect(() => {
    // If user is owner per auth store, grant full access immediately
    // This handles cases where owner isn't in the subusers table
    if (userIsOwner) {
      const fullAccess: PermissionsMap = {};
      const allModules: ModuleName[] = [
        "customers", "invoices", "orders", "products", "reps", "notifications",
      ];
      allModules.forEach((module) => {
        fullAccess[module] = { can_view: true, can_action: true };
      });
      setPermissionsMap(fullAccess);
      setIsOwner(true);
      setRawPermissions([]);
      return;
    }

    // Process subuser response
    if (subUserData) {
      const subUser = (subUserData as SubUserResponse)?.data?.subuser;
      
      if (subUser) {
        setPermissionsMap(permissionsArrayToMap(subUser.permissions));
        setIsOwner(subUser.is_owner);
        setRawPermissions(subUser.permissions);
      }
    }
  }, [subUserData, userIsOwner]);

  // Helper: Check can_view for a module
  const canView = useCallback(
    (module: ModuleName): boolean => {
      // Owners always have access
      if (isOwner) return true;
      return permissionsMap[module]?.can_view ?? false;
    },
    [permissionsMap, isOwner],
  );

  // Helper: Check can_action for a module
  const canAction = useCallback(
    (module: ModuleName): boolean => {
      // Owners always have access
      if (isOwner) return true;
      const perm = permissionsMap[module];
      // can_action requires both can_view AND can_action
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

// ==========================================
// Hook: usePermissions()
// ==========================================

/**
 * usePermissions()
 * 
 * Main hook for accessing permissions in components.
 * Must be used inside a PermissionsProvider.
 * 
 * @example
 * ```tsx
 * const { canView, canAction, isLoading, permissions } = usePermissions();
 * 
 * if (isLoading) return <Skeleton />;
 * if (!canView("customers")) return null;
 * 
 * return (
 *   <div>
 *     {canAction("customers") && <Button>Edit</Button>}
 *   </div>
 * );
 * ```
 */
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
