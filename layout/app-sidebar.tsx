"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { navConfig } from "@/layout/nav-config";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { usePermissions } from "@/components/provider/PermissionsProvider";

import { MobileTopBar } from "@/layout/_components/app-sidebar/mobile-top-bar";
import { SidebarBrand } from "@/layout/_components/app-sidebar/sidebar-brand";
import { CompanyProfileCard } from "@/layout/_components/app-sidebar/company-profile-card";
import { ThemeToggle } from "@/layout/_components/app-sidebar/theme-toggle";
import { LogoutMenuItem } from "@/layout/_components/app-sidebar/logout-menu-item";
import { NavItem } from "@/layout/_components/app-sidebar/nav-item";
import { useNavAlertsSync } from "@/layout/_components/app-sidebar/use-nav-alerts-sync";

interface AppSidebarProps {
  children: React.ReactNode;
  banner?: React.ReactNode;
  onRefresh?: () => void;
}

const AppSidebarContent = ({
  children,
  banner,
  onRefresh,
}: AppSidebarProps) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const user = useAuthStore((state) => state.user);
  const { accountName, isAccountLoading } = usePermissions();
  const router = useRouter();

  useNavAlertsSync(pathname);

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
        <SidebarBrand onRefresh={onRefresh} />

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
            <CompanyProfileCard
              companyName={companyName}
              companyLogo={companyLogo}
              accountName={accountName}
              isAccountLoading={isAccountLoading}
              onboardingCompleted={onboardingCompleted}
              onClick={handleProfileClick}
            />

            <ThemeToggle onAction={handleMobileClose} />

            <LogoutMenuItem onAction={handleMobileClose} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
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
