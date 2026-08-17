import RequireAuth from "@/components/provider/RequireAuth";
import AppSidebar from "@/layout/app-sidebar";

import React from "react";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <RequireAuth>
      <AppSidebar>{children}</AppSidebar>
    </RequireAuth>
  );
};

export default ProtectedLayout;
