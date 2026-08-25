"use client";
import { ProtectedRoute } from "@/guards/protected-route";
import AppSidebar from "@/layout/app-sidebar";
import { useAuthInit } from "@/module/auth/hook/use-token-guard";
import { OnboardingWarningBanner } from "@/components/tredro/onboarding-warning-banner";

import React from "react";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  useAuthInit();
  return (
    <ProtectedRoute>
      <AppSidebar banner={<OnboardingWarningBanner />}>{children}</AppSidebar>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
