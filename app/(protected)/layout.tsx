"use client";

import { ProtectedRoute } from "@/guards/protected-route";
import AppSidebar from "@/layout/app-sidebar";
import { useAuthInit } from "@/module/auth/hook/use-token-guard";
import { OnboardingWarningBanner } from "@/components/tredro/onboarding-warning-banner";
import { PermissionsProvider } from "@/components/provider/PermissionsProvider";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

/**
 * Protected Layout
 * 
 * Wraps protected routes with:
 * 1. ProtectedRoute - authentication check
 * 2. PermissionsProvider - fetches and provides permissions via Context
 * 3. AppSidebar - sidebar with permission-gated nav items
 * 
 * Data Flow:
 * 1. User authenticated (ProtectedRoute)
 * 2. PermissionsProvider fetches from API: GET /companies/subusers/:id
 * 3. Permissions available via usePermissions() hook
 * 4. Sidebar items use PermissionGate to conditionally render
 * 5. Pages use PermissionGate to show UnauthorizedPage when no access
 */
const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  useAuthInit();

  return (
    <ProtectedRoute>
      <PermissionsProvider>
        <AppSidebar banner={<OnboardingWarningBanner />}>
          {children}
        </AppSidebar>
      </PermissionsProvider>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
