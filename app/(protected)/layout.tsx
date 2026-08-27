"use client";

import { ProtectedRoute } from "@/guards/protected-route";
import AppSidebar from "@/layout/app-sidebar";
import { useAuthInit } from "@/module/auth/hook/use-token-guard";
import { OnboardingWarningBanner } from "@/components/tredro/onboarding-warning-banner";
import { PermissionsProvider } from "@/components/provider/PermissionsProvider";
import { PermissionsLoadingGate } from "@/module/users/_components/permissions-loading-gate";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  useAuthInit();

  return (
    <ProtectedRoute>
      <PermissionsProvider>
        <PermissionsLoadingGate>
          <AppSidebar banner={<OnboardingWarningBanner />}>
            {children}
          </AppSidebar>
        </PermissionsLoadingGate>
      </PermissionsProvider>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
