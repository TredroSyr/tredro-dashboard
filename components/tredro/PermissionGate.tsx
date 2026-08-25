"use client";

import React from "react";
import { usePermissions } from "@/components/provider/PermissionsProvider";
import { ModuleName } from "@/module/users/types";
import { Lock, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconRenderer } from "@/assets/icons/iconRenderer";

// ==========================================
// Types
// ==========================================

type SkeletonVariant = "sidebar-item" | "page" | "auto";

interface PermissionGateProps {
  /** Module to check permission for (e.g., "customers") */
  module?: ModuleName;
  /** Require can_action instead of just can_view */
  requireAction?: boolean;
  /** Only owners can access this */
  ownerOnly?: boolean;
  /** Children to render if permission is granted */
  children: React.ReactNode;
  /** Skeleton variant to show while loading */
  skeletonVariant?: SkeletonVariant;
  /** Custom fallback if unauthorized (overrides default behavior). Use `null` to hide component. */
  fallback?: React.ReactNode;
  /** @internal - used by sidebar to detect context */
  _isSidebarItem?: boolean;
}

// ==========================================
// Skeleton Components
// ==========================================

/**
 * Skeleton for sidebar items
 */
function SidebarItemSkeleton() {
  return (
    <div className="flex items-center gap-2 py-2 px-3">
      <div className="h-4 w-4 shrink-0 rounded bg-muted animate-pulse" />
      <div className="h-4 w-24 rounded bg-muted animate-pulse group-data-[collapsible=icon]:hidden" />
    </div>
  );
}

/**
 * Unauthorized / ما عندك صلاحية state for pages
 */
function UnauthorizedPage() {
  const router = useRouter();

  const handleGoHome = () => router.push("/home");
  const handleGoBack = () => router.back();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
    
      <div
        className="relative cursor-pointer group"
        onClick={handleGoHome}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 transition-all duration-300 group-hover:bg-destructive/20 group-hover:scale-110">
          <IconRenderer
            name="lock_outlined"
            className="h-12 w-12 text-destructive animate-pulse"
          />
        </div>
      
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-destructive/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-destructive font-medium">
            اضغط للعودة إلى الرئيسية
          </div>
        </div>
      </div>

      {/* النص */}
      <div className="space-y-2">
        <h1
          className="text-2xl font-bold text-foreground cursor-pointer hover:text-destructive transition-colors duration-300"
          onClick={handleGoHome}
        >
          غير مصرَّح لك بالوصول
        </h1>
        <p className="text-muted-foreground">
          عذرًا، لا تملك الصلاحيات الكافية للوصول إلى هذه الصفحة.
          <br />
          يُرجى التواصل مع المسؤول إن كنت تعتقد أن ذلك خطأ.
        </p>
      </div>

  

      {/* الأزرار */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          onClick={handleGoBack}
          className="gap-2 cursor-pointer transition-all duration-200 transform hover:scale-105"
        >
          <IconRenderer name="arrow_left_outlined" className="h-4 w-4" />
          العودة
        </Button>

        <Link href="/home">
          <Button className="gap-2 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <IconRenderer name="home_outlined" className="h-4 w-4" />
            الصفحة الرئيسية
          </Button>
        </Link>
      </div>

      {/* نقاط زخرفية */}
      <div className="flex justify-center space-x-2 mt-4">
        <div className="w-2.5 h-2.5 bg-destructive/70 rounded-full animate-pulse" />
        <div className="w-2.5 h-2.5 bg-destructive/70 rounded-full animate-pulse delay-75" />
        <div className="w-2.5 h-2.5 bg-destructive/70 rounded-full animate-pulse delay-150" />
      </div>
    </div>
  </div>
  );
}

// ==========================================
// PermissionGate Component
// ==========================================

/**
 * PermissionGate
 * 
 * Single reusable component for permission-based rendering.
 * 
 * Behavior:
 * - While loading: renders skeleton based on skeletonVariant
 * - If can_view=false for sidebar item: renders nothing (hidden)
 * - If can_view=false for page: renders UnauthorizedPage
 * - If can_view=true: renders children
 * 
 * @example
 * // Sidebar item usage:
 * <PermissionGate module="customers" _isSidebarItem>
 *   <SidebarItem ... />
 * </PermissionGate>
 * 
 * @example
 * // Page usage:
 * <PermissionGate module="customers">
 *   <CustomersPage />
 * </PermissionGate>
 * 
 * @example
 * // Require action permission (can_view + can_action):
 * <PermissionGate module="customers" requireAction>
 *   <EditButton />
 * </PermissionGate>
 */
export function PermissionGate(props: PermissionGateProps) {
  const {
    module,
    requireAction = false,
    ownerOnly = false,
    children,
    skeletonVariant = "auto",
    fallback,
    _isSidebarItem = false,
  } = props;
  const { canView, canAction, isLoading, isOwner } = usePermissions();

  // Track if fallback was explicitly provided (including null)
  const hasFallback = 'fallback' in props;

  // Determine actual variant based on context
  const actualVariant =
    skeletonVariant === "auto"
      ? _isSidebarItem
        ? "sidebar-item"
        : "page"
      : skeletonVariant;

  // 1. While loading → show skeleton or fallback
  if (isLoading) {
    if (hasFallback) {
      return <>{fallback}</>;
    }
    if (actualVariant === "sidebar-item") {
      return <SidebarItemSkeleton />;
    }
    // For pages, return loading skeleton
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // 2. Check permission
  let hasPermission = true;

  if (ownerOnly) {
    hasPermission = isOwner;
  } else if (module) {
    hasPermission = requireAction ? canAction(module) : canView(module);
  }

  // 3. No permission
  if (!hasPermission) {
    // Custom fallback (including null)
    if (hasFallback) {
      return <>{fallback}</>;
    }

    // Sidebar item: render nothing (hidden)
    if (_isSidebarItem || actualVariant === "sidebar-item") {
      return null;
    }

    // Page: render UnauthorizedPage
    return <UnauthorizedPage />;
  }

  // 4. Has permission: render children
  return <>{children}</>;
}

// Re-export UnauthorizedPage for direct usage
export { UnauthorizedPage };
