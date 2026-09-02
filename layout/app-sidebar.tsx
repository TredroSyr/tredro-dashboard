"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useThemeStore } from "@/store/use-theme-store";
import { useAuthStore } from "@/module/auth/store/auth-store";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import { ModuleName } from "@/module/users/types";
import { useState } from "react";

// ==========================================
// Nav Config - Dynamic Icon Rendering
// ==========================================

/**
 * Single source of truth for navigation items.
 * Uses dynamic icon rendering via IconRenderer with icon names as strings.
 */
interface NavItemConfig {
  key: string;
  label: string;
  href: string;
  icon: iconName;
  activeIcon: iconName;
  /** Module required for can_view permission (uses PermissionGate) */
  requiredModule?: ModuleName;
  /** Owner-only access (uses isOwner from permissions context) */
  ownerOnly?: boolean;
}

const navConfig: NavItemConfig[] = [
  {
    key: "home",
    label: "الرئيسية",
    href: "/home",
    icon: "home_outlined",
    activeIcon: "home_filled",
    // No restriction - everyone can see home
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
    label: "الطلبات",
    href: "/orders",
    icon: "list_outlined",
    activeIcon: "list_filled",
    requiredModule: "orders",
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
    requiredModule: "invoices",
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
    ownerOnly: true,
  },
];

// ==========================================
// Sub Components
// ==========================================

const MobileTopBar = ({ onRefresh }: { onRefresh?: () => void }) => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <SidebarTrigger className="cursor-pointer transition-transform duration-200 hover:scale-110" />
      <button type="button" onClick={onRefresh}>
        <Image
          src="/tredro/full_logo.svg"
          alt="logo"
          width={100}
          height={50}
          className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        />
      </button>
    </div>
  );
};

const ThemeToggle = ({ onAction }: { onAction: () => void }) => {
  const { theme, toggleTheme, hasHydrated } = useThemeStore();
  const isDark = hasHydrated && theme === "dark";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={isDark ? "الوضع النهاري" : "الوضع الليلي"}
        onClick={() => {
          toggleTheme();
          onAction();
        }}
        className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:bg-muted active:scale-[0.97]"
      >
        <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <Sun
            className={`absolute h-4 w-4 text-primary transition-all duration-300 ${
              isDark
                ? "-rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <Moon
            className={`absolute h-4 w-4 text-primary transition-all duration-300 ${
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-0 opacity-0"
            }`}
          />
        </span>
        <span className="truncate">
          {isDark ? "الوضع الليلي" : "الوضع النهاري"}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const LogoutMenuItem = ({ onAction }: { onAction: () => void }) => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [open, setOpen] = useState(false);

  const handleConfirmLogout = () => {
    clearAuth();
    setOpen(false);
    onAction();
    router.push("/auth/login");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="تسجيل الخروج"
          onClick={() => setOpen(true)}
          className="cursor-pointer text-destructive transition-all duration-200 hover:translate-x-1 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97]"
        >
          <IconRenderer
            name="logout_outlined"
            className="h-4 w-4 shrink-0 text-destructive"
          />
          <span className="truncate">تسجيل الخروج</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل الخروج</DialogTitle>
          <DialogDescription>هل انت متاكد من تسجيل الخروج</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleConfirmLogout}>
            تسجيل الخروج
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
// Sidebar Skeleton (Loading State)
// ==========================================

/**
 * Sidebar skeleton shown while permissions are loading.
 * Matches the exact shape of the actual sidebar items.
 */
function SidebarSkeleton() {
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

// ==========================================
// Single Nav Item Component
// ==========================================

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Single nav item with dynamic icon rendering.
 * Wrapped with PermissionGate for conditional rendering.
 */
function NavItem({ item, isActive, onClick }: NavItemProps) {
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
            <IconRenderer
              name={iconName}
              className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                isActive
                  ? "scale-110 text-primary"
                  : "text-muted-foreground group-hover/menu-item:scale-110 group-hover/menu-item:text-primary"
              }`}
            />
            <span className="truncate group-data-[collapsible=icon]:hidden">
              {item.label}
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
  if (item.ownerOnly) {
    return (
      <PermissionGate ownerOnly _isSidebarItem>
        {content}
      </PermissionGate>
    );
  }

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

// ==========================================
// Main Sidebar Content
// ==========================================

interface AppSidebarProps {
  children: React.ReactNode;
  banner?: React.ReactNode;
  onRefresh?: () => void;
}

const AppSidebarContent = ({ children, banner, onRefresh }: AppSidebarProps) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const companyName = user?.company?.name || "Tredro";
  const companyLogo = user?.company?.logo;
  const onboardingCompleted = user?.company?.onboarding_completed;

  const handleMobileClose = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleProfileClick = () => {
    handleMobileClose();
    router.push("/profile");
  };

  return (
    <>
      <Sidebar
        side="right"
        collapsible="icon"
        className="border-border transition-[width] duration-300 ease-in-out"
      >
        <SidebarHeader className="px-2 py-4">
          <div className="flex items-center justify-between gap-2 group-data-[state=expanded]:flex-row-reverse group-data-[collapsible=icon]:flex-col-reverse group-data-[collapsible=icon]:items-center lg:justify-center">
            <SidebarTrigger className="hidden shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110 md:flex lg:hidden" />

            <button
              type="button"
              onClick={onRefresh}
              className="hidden group-data-[state=expanded]:block"
            >
              <Image
                src="/tredro/full_logo.svg"
                alt="logo"
                width={140}
                height={70}
                className="h-auto w-[140px] cursor-pointer object-contain transition-all duration-200 hover:scale-105 active:scale-95"
              />
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="hidden group-data-[collapsible=icon]:block"
            >
              <Image
                src="/tredro/logo.svg"
                alt="logo"
                width={32}
                height={32}
                className="h-auto w-8 cursor-pointer object-contain transition-all duration-200 hover:scale-110 active:scale-95"
              />
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-3">
                {navConfig.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <NavItem
                      key={item.key}
                      item={item}
                      isActive={isActive}
                      onClick={handleMobileClose}
                    />
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-3 px-2 pb-4">
          <SidebarMenu className="gap-3">
            {/* Company Profile Card */}
            <div
              onClick={handleProfileClick}
              className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-primary/5 p-3 transition-all duration-200 hover:bg-primary/10 active:scale-[0.97]"
            >
              <Avatar className="h-10 w-10 shrink-0 border-2 border-background">
                <AvatarImage
                  src={companyLogo || undefined}
                  alt={companyName}
                  className="h-full w-full object-cover"
                />
                <AvatarFallback className="bg-primary/20 text-primary flex items-center justify-center">
                  <IconRenderer
                    name="no_image_filled"
                    className="h-5 w-5 text-primary/50"
                  />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold text-foreground">
                  {companyName}
                </p>
                <div className="flex items-center gap-2">
                  {!onboardingCompleted && (
                    <Badge
                      variant="secondary"
                      className="h-4 bg-amber-100 px-1.5 text-[10px] text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    >
                      غير مكتمل
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <ThemeToggle onAction={handleMobileClose} />

            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="المساعدة والمعلومات"
                onClick={handleMobileClose}
                className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:bg-muted active:scale-[0.97]"
              >
                <IconRenderer
                  name="help_outlined"
                  className="h-4 w-4 shrink-0 text-primary"
                />
                <span className="truncate">المساعدة والمعلومات</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <LogoutMenuItem onAction={handleMobileClose} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <MobileTopBar onRefresh={onRefresh} />
        <div className="flex h-full flex-col pt-12  lg:pt-0">
          {banner}
          <main className="flex-1   overflow-auto">{children}</main>
        </div>
      </SidebarInset>
    </>
  );
};

const AppSidebar = ({ children, banner, onRefresh }: AppSidebarProps) => {
  return (
    <SidebarProvider>
      <AppSidebarContent banner={banner} onRefresh={onRefresh}>
        {children}
      </AppSidebarContent>
    </SidebarProvider>
  );
};

export default AppSidebar;
