import type { iconName } from "@/assets/icons/iconRenderer/types";
import type { ModuleName } from "@/module/users/types";

/**
 * Single source of truth for navigation items. The sidebar renders from it,
 * and the default landing route is the first entry the signed-in user may view,
 * so the order here is also the priority order.
 */
export interface NavItemConfig {
  key: string;
  label: string;
  href: string;
  icon: iconName;
  activeIcon: iconName;
  /** Module required for can_view permission (uses PermissionGate) */
  requiredModule?: ModuleName;
}

export const navConfig: NavItemConfig[] = [
  {
    key: "home",
    label: "الرئيسية",
    href: "/home",
    icon: "home_outlined",
    activeIcon: "home_filled",
    requiredModule: "overview",
  },
  {
    key: "reps",
    label: "المناديب",
    href: "/reps",
    icon: "apps_outlined",
    activeIcon: "apps_filled",
    requiredModule: "reps",
  },
  {
    key: "customers",
    label: "الزبائن",
    href: "/customers",
    icon: "users_outlined",
    activeIcon: "users_filled",
    requiredModule: "customers",
  },
  {
    key: "products",
    label: "المنتجات",
    href: "/products",
    icon: "bundle_outlined",
    activeIcon: "bundle_filled",
    requiredModule: "products",
  },
  {
    key: "orders",
    label: "طلبات العملاء",
    href: "/orders",
    icon: "list_outlined",
    activeIcon: "list_filled",
    requiredModule: "customer_requests",
  },
  {
    key: "invoices",
    label: "الفواتير",
    href: "/invoices",
    icon: "payment_outlined",
    activeIcon: "payment_filled",
    requiredModule: "invoices",
  },
  {
    key: "warehouses",
    label: "المستودعات",
    href: "/warehouses",
    icon: "folder_outlined",
    activeIcon: "folder_filled",
    requiredModule: "warehouses",
  },
  {
    key: "stock-transfers",
    label: "طلبات المندوب",
    href: "/stock-transfers",
    icon: "list_outlined",
    activeIcon: "list_filled",
    requiredModule: "stock_transfers",
  },
  {
    key: "roles",
    label: "المستخدمون والصلاحيات",
    href: "/roles",
    icon: "authorities_outlined",
    activeIcon: "authorities_filled",
    requiredModule: "users",
  },
  {
    key: "notifications",
    label: "الإشعارات",
    href: "/notifications",
    icon: "notification_outlined",
    activeIcon: "notification_filled",
    // No restriction - everyone can see their own notifications
  },
];

/**
 * First nav route the user may open — the landing page after login. Items with
 * no required module (notifications) are open to everyone, so this only
 * returns null if that entry is ever removed.
 */
export function getFirstAccessibleHref(
  canView: (module: ModuleName) => boolean,
): string | null {
  const item = navConfig.find(
    (entry) => !entry.requiredModule || canView(entry.requiredModule),
  );
  return item?.href ?? null;
}
