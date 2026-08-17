import { ProtectedRoute } from "@/guards/protected-route";
import AppSidebar from "@/layout/app-sidebar";

import React from "react";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <ProtectedRoute>
      <AppSidebar>{children}</AppSidebar>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
