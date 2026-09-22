"use client";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { navConfig } from "@/layout/nav-config";

/**
 * Sidebar skeleton shown while permissions are loading.
 * Matches the exact shape of the actual sidebar items.
 */
export function SidebarSkeleton() {
  // Show skeleton for all nav items during loading
  const skeletonCount = navConfig.length;

  return (
    <SidebarMenu className="gap-3">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <div className="flex items-center gap-2 py-2 px-3">
            <div className="h-4 w-4 shrink-0 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
