"use client";

import Link from "next/link";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { type NavItemConfig } from "@/layout/nav-config";
import { NavAlertIcon } from "./nav-alert-icon";
import { OrdersPendingBadge, NotificationsUnreadBadge } from "./nav-badges";

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Single nav item with dynamic icon rendering.
 * Wrapped with PermissionGate for conditional rendering.
 */
export function NavItem({ item, isActive, onClick }: NavItemProps) {
  // Dynamic icon rendering via IconRenderer
  // Uses icon names as strings (from navConfig)
  const iconName = isActive ? item.activeIcon : item.icon;

  const content = (
    <SidebarMenuItem key={item.key} className="group/menu-item">
      <SidebarMenuButton
        render={
          <Link
            href={item.href}
            onClick={onClick}
            className="flex w-full flex-nowrap items-center gap-2 overflow-hidden"
          >
            <NavAlertIcon
              navKey={item.key}
              iconName={iconName}
              className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                isActive
                  ? "scale-110 text-primary"
                  : "text-muted-foreground group-hover/menu-item:scale-110 group-hover/menu-item:text-primary"
              }`}
            />
            <span className="flex flex-1 items-center justify-between gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="truncate">{item.label}</span>
              {item.key === "orders" && <OrdersPendingBadge />}
              {item.key === "notifications" && <NotificationsUnreadBadge />}
            </span>
          </Link>
        }
        tooltip={item.label}
        isActive={isActive}
        className={`relative cursor-pointer overflow-hidden transition-all duration-200 ease-out hover:translate-x-1 hover:bg-primary/10 active:scale-[0.97] ${
          isActive
            ? "bg-primary/10 font-semibold text-primary before:absolute before:right-0 before:top-1/2 before:h-4/5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary group-data-[collapsible=icon]:before:right-0"
            : "text-foreground"
        }`}
      />
    </SidebarMenuItem>
  );

  // Wrap with PermissionGate based on item config
  if (item.requiredModule) {
    return (
      <PermissionGate module={item.requiredModule} _isSidebarItem>
        {content}
      </PermissionGate>
    );
  }

  // No restriction
  return content;
}
