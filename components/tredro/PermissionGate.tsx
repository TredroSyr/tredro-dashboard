"use client";

import React from "react";
import { usePermissions } from "@/components/provider/PermissionsProvider";
import { ModuleName } from "@/module/users/types";
import { PermissionDeniedState } from "@/module/users/_components/permission-denied-state";

interface PermissionGateProps {
  module?: ModuleName;
  requireAction?: boolean;
  ownerOnly?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  _isSidebarItem?: boolean;
}

export function PermissionGate(props: PermissionGateProps) {
  const {
    module,
    requireAction = false,
    ownerOnly = false,
    children,
    fallback,
    _isSidebarItem = false,
  } = props;
  const { canView, canAction, isOwner } = usePermissions();

  const hasFallback = "fallback" in props;

  let hasPermission = true;

  if (ownerOnly) {
    hasPermission = isOwner;
  } else if (module) {
    hasPermission = requireAction ? canAction(module) : canView(module);
  }

  if (!hasPermission) {
    if (hasFallback) {
      return <>{fallback}</>;
    }

    if (_isSidebarItem) {
      return null;
    }

    return <PermissionDeniedState />;
  }

  return <>{children}</>;
}
