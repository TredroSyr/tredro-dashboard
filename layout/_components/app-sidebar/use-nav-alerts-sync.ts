"use client";

import { useEffect, useRef } from "react";
import { navConfig } from "@/layout/nav-config";
import { useNavAlertsStore } from "@/store/use-nav-alerts-store";
import { useUnreadNotificationsCountQuery } from "@/module/notifications/hooks";

/**
 * Keeps sidebar nav alerts in sync: an unread-count increase (push or the
 * 60s poll) flags the notifications bell, and visiting a page clears its
 * alert — including one that arrives while the user is already on it. The
 * first count loaded on mount is not treated as "new".
 */
export function useNavAlertsSync(pathname: string) {
  const alerts = useNavAlertsStore((state) => state.alerts);
  const flagAlert = useNavAlertsStore((state) => state.flag);
  const clearAlert = useNavAlertsStore((state) => state.clear);
  const { data: unreadData } = useUnreadNotificationsCountQuery();
  const unreadCount = unreadData?.data?.unread_count;
  const prevUnreadCount = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (unreadCount === undefined) return;
    if (
      prevUnreadCount.current !== undefined &&
      unreadCount > prevUnreadCount.current
    ) {
      flagAlert("notifications");
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, flagAlert]);

  useEffect(() => {
    navConfig.forEach((item) => {
      if (alerts[item.key] && pathname.startsWith(item.href)) {
        clearAlert(item.key);
      }
    });
  }, [pathname, alerts, clearAlert]);
}
