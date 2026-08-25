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
import { useState } from "react";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: iconName;
  activeIcon: iconName;
  addable?: boolean;
};

const mainNavItems: NavItem[] = [
  {
    key: "home",
    label: "الرئيسية",
    href: "/home",
    icon: "home_outlined",
    activeIcon: "home_filled",
  },
  {
    key: "profile",
    label: "الملف الشخصي",
    href: "/profile",
    icon: "user_outlined",
    activeIcon: "user_filled",
  },
  {
    key: "reps",
    label: "المناديب",
    href: "/reps",
    icon: "apps_outlined",
    activeIcon: "apps_filled",
  },
  {
    key: "customers",
    label: "الزبائن",
    href: "/customers",
    icon: "users_outlined",
    activeIcon: "users_filled",
    // addable: true,
  },
  {
    key: "products",
    label: "المنتجات",
    href: "/products",
    icon: "bundle_outlined",
    activeIcon: "bundle_filled",
  },
  {
    key: "orders",
    label: "الطلبات",
    href: "/orders",
    icon: "list_outlined",
    activeIcon: "list_filled",
  },
  {
    key: "invoices",
    label: "الفواتير",
    href: "/invoices",
    icon: "payment_outlined",
    activeIcon: "payment_filled",
  },
  {
    key: "roles",
    label: "المستخدمون والصلاحيات",
    href: "/roles",
    icon: "authorities_outlined",
    activeIcon: "authorities_filled",
  },
  {
    key: "settings",
    label: "الإعدادات",
    href: "/settings",
    icon: "settings_outlined",
    activeIcon: "settings_filled",
  },
];

const MobileTopBar = () => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <SidebarTrigger className="cursor-pointer transition-transform duration-200 hover:scale-110" />

      <Image
        src="/tredro/full_logo.svg"
        alt="logo"
        width={100}
        height={50}
        className="cursor-pointer transition-transform duration-200 hover:scale-105"
      />
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

interface AppSidebarProps {
  children: React.ReactNode;
  banner?: React.ReactNode;
}

const AppSidebarContent = ({ children, banner }: AppSidebarProps) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const companyName = user?.company?.name || "Tredro";
  const companyLogo = user?.company?.logo;
  const onboardingCompleted = user?.company?.onboarding_completed;
  const userName = user?.name || "";

  // Close the sidebar automatically on small screens whenever
  // the user taps a nav link or any action item.
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

            <Image
              src="/tredro/full_logo.svg"
              alt="logo"
              width={140}
              height={70}
              className="hidden h-auto w-[140px] cursor-pointer object-contain transition-all duration-200 group-data-[state=expanded]:block"
            />

            <Image
              src="/tredro/logo.svg"
              alt="logo"
              width={32}
              height={32}
              className="hidden h-auto w-8 cursor-pointer object-contain transition-all duration-200 group-data-[collapsible=icon]:block"
            />
          </div>

         
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-3">
                {mainNavItems.map(
                  ({ key, label, href, icon, activeIcon, addable }) => {
                    const isActive =
                      href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(href);

                    return (
                      <SidebarMenuItem key={key} className="group/menu-item">
                        <SidebarMenuButton
                          render={
                            <Link
                              href={href}
                              onClick={handleMobileClose}
                              className="flex w-full flex-nowrap items-center gap-2 overflow-hidden"
                            >
                              <IconRenderer
                                name={isActive ? activeIcon : icon}
                                className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                                  isActive
                                    ? "scale-110 text-primary"
                                    : "text-muted-foreground group-hover/menu-item:scale-110 group-hover/menu-item:text-primary"
                                }`}
                              />
                              <span className="truncate group-data-[collapsible=icon]:hidden">
                                {label}
                              </span>
                              {addable && (
                                <Badge
                                  variant="secondary"
                                  className="mr-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0 transition-transform duration-200 group-hover/menu-item:scale-110 group-data-[collapsible=icon]:hidden"
                                >
                                  <IconRenderer
                                    name="plus_outlined"
                                    className="h-2.5 w-2.5 text-primary"
                                  />
                                </Badge>
                              )}
                            </Link>
                          }
                          tooltip={label}
                          isActive={isActive}
                          className={`relative cursor-pointer overflow-hidden transition-all duration-200 ease-out hover:translate-x-1 hover:bg-primary/10 active:scale-[0.97] ${
                            isActive
                              ? "bg-primary/10 font-semibold text-primary before:absolute before:right-0 before:top-1/2 before:h-4/5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary group-data-[collapsible=icon]:before:right-0"
                              : "text-foreground"
                          }`}
                        />
                      </SidebarMenuItem>
                    );
                  },
                )}
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
              {companyLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-full w-full object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/20 text-primary">
                {companyName.charAt(0)}
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
        <MobileTopBar />
        <div className="flex h-full flex-col">
          <div className="m-2">

          {banner}
          </div>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarInset>
    </>
  );
};

const AppSidebar = ({ children, banner }: AppSidebarProps) => {
  return (
    <SidebarProvider>
      <AppSidebarContent banner={banner}>{children}</AppSidebarContent>
    </SidebarProvider>
  );
};

export default AppSidebar;
