"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/components/provider/PermissionsProvider";
import { Loading } from "@/components/tredro/loading";

interface PermissionsLoadingGateProps {
  children: ReactNode;
}

export function PermissionsLoadingGate({
  children,
}: PermissionsLoadingGateProps) {
  const { isLoading } = usePermissions();

  if (isLoading) {
    return <Loading />;
  }

  return <>{children}</>;
}
