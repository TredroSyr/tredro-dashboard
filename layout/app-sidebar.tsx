"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useThemeStore } from "@/store/use-theme-store";

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
    key: "reps",
    label: "المناديب",
    href: "/reps",
    icon: "apps_outlined",
    activeIcon: "apps_filled",
    addable: true,
  },
  {
    key: "customers",
    label: "الزبائن",
    href: "/customers",
    icon: "users_outlined",
    activeIcon: "users_filled",
    addable: true,
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

const BREAKPOINTS = {
  desktop: 1024,
  tablet: 768,
};

type ViewportBucket = "mobile" | "tablet" | "desktop";

const getViewportBucket = (width: number): ViewportBucket => {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
};

const SidebarBreakpointSync = () => {
  const { setOpen } = useSidebar();
  const lastBucket = useRef<ViewportBucket | null>(null);

  useEffect(() => {
    const syncWithViewport = () => {
      const bucket = getViewportBucket(window.innerWidth);

      // Only react when we actually cross a breakpoint, not on every
      // resize pixel (e.g. a scrollbar appearing when the sidebar opens),
      // otherwise the trigger click gets immediately overridden.
      if (bucket === lastBucket.current) return;
      lastBucket.current = bucket;

      if (bucket === "desktop") {
        setOpen(true);
      } else if (bucket === "tablet") {
        setOpen(false);
      }
    };

    syncWithViewport();
    window.addEventListener("resize", syncWithViewport);
    return () => window.removeEventListener("resize", syncWithViewport);
  }, [setOpen]);

  return null;
};

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

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={isDark ? "الوضع النهاري" : "الوضع الليلي"}
        onClick={toggleTheme}
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

type AppSidebarProps = {
  children: React.ReactNode;
};

const AppSidebar = ({ children }: AppSidebarProps) => {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <SidebarBreakpointSync />
      <Sidebar
        side="right"
        collapsible="icon"
        className="border-border transition-[width] duration-300 ease-in-out"
      >
        <SidebarHeader className="px-2 py-4">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col-reverse group-data-[collapsible=icon]:items-center">
            <Image
              src="/tredro/full_logo.svg"
              alt="logo"
              width={140}
              height={70}
              className="h-auto w-[140px] cursor-pointer object-contain transition-all duration-200 group-data-[collapsible=icon]:w-8"
            />
            <SidebarTrigger className="hidden shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110 md:flex lg:hidden" />
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
                          asChild
                          tooltip={label}
                          isActive={isActive}
                          className={`relative cursor-pointer overflow-hidden transition-all duration-200 ease-out hover:translate-x-1 hover:bg-primary/10 active:scale-[0.97] ${
                            isActive
                              ? "bg-primary/10 font-semibold text-primary before:absolute before:right-0 before:top-1/2 before:h-4/5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary group-data-[collapsible=icon]:before:right-0"
                              : "text-foreground"
                          }`}
                        >
                          <Link
                            href={href}
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
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  },
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-3 px-2 pb-4">
          <div className="rounded-2xl bg-muted p-4 transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-foreground">
              الترقية للنسخة الاحترافية
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              شهر مجاني مع مناديب وتقارير غير محدودة
            </p>
            <Button className="mt-3 w-full cursor-pointer">ترقية الآن</Button>
          </div>

          <SidebarMenu>
            <ThemeToggle />
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="المساعدة والمعلومات"
                className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:bg-muted active:scale-[0.97]"
              >
                <IconRenderer
                  name="help_outlined"
                  className="h-4 w-4 shrink-0 text-primary"
                />
                <span className="truncate">المساعدة والمعلومات</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="تسجيل الخروج"
                className="cursor-pointer text-destructive transition-all duration-200 hover:translate-x-1 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97]"
              >
                <IconRenderer
                  name="logout_outlined"
                  className="h-4 w-4 shrink-0 text-destructive"
                />
                <span className="truncate">تسجيل الخروج</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <MobileTopBar />
        <main className="pt-16 md:pt-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppSidebar;
