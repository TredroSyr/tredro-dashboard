"use client";

import { Badge } from "@/components/ui/badge";
import { useCustomerRequestsQuery } from "@/module/orders/hooks";
import { useUnreadNotificationsCountQuery } from "@/module/notifications/hooks";

const countBadgeClassName =
  "h-4 shrink-0 rounded-full bg-amber-100 px-1.5 text-[10px] tabular-nums text-amber-700 group-data-[collapsible=icon]:hidden dark:bg-amber-950/50 dark:text-amber-400";

/** Live count of orders awaiting a response — the "more details" carried alongside the orders nav label. */
export function OrdersPendingBadge() {
  const { data } = useCustomerRequestsQuery({ status: "pending" });
  const count = data?.data?.pagination?.count ?? 0;

  if (!count) return null;

  return (
    <Badge variant="secondary" className={countBadgeClassName}>
      {count}
    </Badge>
  );
}

/** Live unread count for the bell — backed by GET /notifications/unread-count/. */
export function NotificationsUnreadBadge() {
  const { data } = useUnreadNotificationsCountQuery();
  const count = data?.data?.unread_count ?? 0;

  if (!count) return null;

  return (
    <Badge
      variant="destructive"
      className={
        "h-4 shrink-0 rounded-full  px-1.5 text-[10px] tabular-nums  group-data-[collapsible=icon]:hidden"
      }
    >
      {count}
    </Badge>
  );
}
