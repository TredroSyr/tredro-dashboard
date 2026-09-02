"use client";

import { useCallback, useEffect } from "react";
import { ProtectedRoute } from "@/guards/protected-route";
import AppSidebar from "@/layout/app-sidebar";
import { useAuthInit } from "@/module/auth/hook/use-token-guard";
import { OnboardingWarningBanner } from "@/components/tredro/onboarding-warning-banner";
import { PermissionsProvider } from "@/components/provider/PermissionsProvider";
import { PermissionsLoadingGate } from "@/module/users/_components/permissions-loading-gate";
import { RefreshIndicator } from "@/components/tredro/refresh-indicator";
import { RefreshProvider, useRefresh } from "@/components/provider/RefreshProvider";
import { useQueryClient } from "@tanstack/react-query";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const MIN_SPIN_MS = 800;

function ProtectedLayoutContent({ children }: ProtectedLayoutProps) {
  useAuthInit();
  const queryClient = useQueryClient();
  const { isRefreshing, startRefresh, endRefresh } = useRefresh();

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    const startedAt = Date.now();
    startRefresh();

    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      const remaining = MIN_SPIN_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      endRefresh();
    }
  }, [queryClient, isRefreshing, startRefresh, endRefresh]);

  // Auto-refresh when tab becomes visible (user opens from phone/switches back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Don't show loading indicator for background visibility refreshes
        // Just silently refetch active queries
        queryClient.refetchQueries({ type: "active" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  return (
    <ProtectedRoute>
      <RefreshIndicator />
      <PermissionsProvider>
        <PermissionsLoadingGate>
          <AppSidebar banner={<OnboardingWarningBanner />} onRefresh={handleRefresh}>
            {children}
          </AppSidebar>
        </PermissionsLoadingGate>
      </PermissionsProvider>
    </ProtectedRoute>
  );
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <RefreshProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </RefreshProvider>
  );
};

export default ProtectedLayout;
