import { ModuleName, Permission } from "@/module/users/types";

export type PermissionsMap = {
  [module in ModuleName]?: {
    can_view: boolean;
    can_action: boolean;
  };
};

export const ALL_MODULES: ModuleName[] = [
  "customers",
  "invoices",
  "orders",
  "products",
  "reps",
  "stock_transfers",
  "customer_requests",
  "notifications",
  "reports",
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
