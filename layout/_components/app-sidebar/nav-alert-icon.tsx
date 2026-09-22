"use client";

import { iconName } from "@/assets/icons/iconRenderer/types";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useNavAlertsStore } from "@/store/use-nav-alerts-store";

/**
 * Nav icon that draws attention when its page just received a new
 * notification: it turns red, shakes, and gets a small pulsing red dot —
 * visible even when the sidebar is collapsed to icon-only mode (unlike the
 * count badges). The alert is cleared once the user visits the page.
 */
export function NavAlertIcon({
  navKey,
  iconName,
  className,
}: {
  navKey: string;
  iconName: iconName;
  className: string;
}) {
  const hasAlert = useNavAlertsStore((state) => !!state.alerts[navKey]);

  return (
    <span className="relative flex h-4 w-4 shrink-0">
      <IconRenderer
        name={iconName}
        className={`${className} ${
          hasAlert ? "animate-bell-shake text-destructive" : ""
        }`}
      />
      {hasAlert && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
      )}
    </span>
  );
}
