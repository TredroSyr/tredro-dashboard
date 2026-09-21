import { ModuleName, Permission } from "@/module/users/types";

export type PermissionsMap = {
  [module in ModuleName]?: {
    can_view: boolean;
    can_action: boolean;
  };
};

export const ALL_MODULES: ModuleName[] = [
  "overview",
  "products",
  "warehouses",
  "customers",
  "reps",
  "invoices",
  "orders",
  "stock_transfers",
  "customer_requests",
  "notifications",
  "reports",
  "users",
  "profile",
  "billing",
  "settings",
];

export function buildEmptyPermissionsMap(): PermissionsMap {
  const map: PermissionsMap = {};
  ALL_MODULES.forEach((module) => {
    map[module] = { can_view: false, can_action: false };
  });
  return map;
}

export function buildFullAccessMap(): PermissionsMap {
  const map: PermissionsMap = {};
  ALL_MODULES.forEach((module) => {
    map[module] = { can_view: true, can_action: true };
  });
  return map;
}

export function permissionsArrayToMap(
  permissions: Permission[],
): PermissionsMap {
  const map = buildEmptyPermissionsMap();
  permissions.forEach((perm) => {
    map[perm.module] = {
      can_view: perm.can_view,
      can_action: perm.can_action,
    };
  });
  return map;
}

/**
 * Normalises the two shapes a user's grants can arrive in — the array returned
 * by the sub-user endpoints and the `{ [module]: { can_view, can_action } }`
 * object carried on the login payload — into one map. A missing key means
 * "closed".
 */
export function normalizePermissions(
  source: Permission[] | PermissionsMap | null | undefined,
): PermissionsMap {
  if (!source) return buildEmptyPermissionsMap();
  if (Array.isArray(source)) return permissionsArrayToMap(source);

  const map = buildEmptyPermissionsMap();
  (Object.keys(source) as ModuleName[]).forEach((module) => {
    const grant = source[module];
    if (grant) {
      map[module] = {
        can_view: !!grant.can_view,
        can_action: !!grant.can_action,
      };
    }
  });
  return map;
}
