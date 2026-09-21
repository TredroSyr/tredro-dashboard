"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/components/provider/PermissionsProvider";
import { Loading } from "@/components/tredro/loading";
import { PermissionDeniedState } from "@/module/users/_components/permission-denied-state";
import { getFirstAccessibleHref } from "@/layout/nav-config";

/**
 * Sends the user to the first nav route they are allowed to view. Rendered as
 * the fallback of a gate the user failed (the home page for staff without
 * `overview`), so a role never lands on a screen it can't open.
 */
export function DefaultRouteRedirect() {
  const router = useRouter();
  const { canView } = usePermissions();
  const href = getFirstAccessibleHref(canView);

  useEffect(() => {
    if (href) router.replace(href);
  }, [href, router]);

  if (!href) return <PermissionDeniedState />;

  return <Loading />;
}
