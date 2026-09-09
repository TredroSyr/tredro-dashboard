"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "../hooks";
import { resolveNotificationUrl } from "../lib/notification-routing";
import { Notification } from "../types";

const EVENT_ICON: Record<string, iconName> = {
  customer_request: "list_outlined",
  stock_transfer: "folder_outlined",
};

const getEventIcon = (eventKey: string): iconName =>
  EVENT_ICON[eventKey.split(".")[0]] ?? "notification_outlined";

function NotificationCard({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
}) {
  return (
    <Card
      onClick={() => onOpen(notification)}
      className={cn(
        "cursor-pointer flex-row items-start gap-3 px-4 transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-primary/5 ring-primary/20",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          notification.is_read
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <IconRenderer
          name={getEventIcon(notification.event_key)}
          className="h-4 w-4"
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ar,
          })}
        </p>
      </div>
    </Card>
  );
}

export default function NotificationsView() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Notification[]>([]);

  const { data, isLoading, isFetching } = useNotificationsQuery({
    unread: filter === "unread" ? true : undefined,
    page,
  });

  React.useEffect(() => {
    if (!data) return;
    setItems((prev) =>
      page === 1 ? data.data.notifications : [...prev, ...data.data.notifications],
    );
  }, [data, page]);

  const handleFilterChange = (value: "all" | "unread") => {
    setFilter(value);
    setPage(1);
  };

  const unreadCount = data?.data.unread_count ?? 0;
  const totalPages = data?.data.pagination.total_pages ?? 1;
  const hasMore = page < totalPages;

  const { mutate: markRead } = useMarkNotificationReadMutation();
  const { mutate: markAllRead, isPending: isMarkingAllRead } =
    useMarkAllNotificationsReadMutation();

  const openNotification = (notification: Notification) => {
    if (!notification.is_read) markRead(notification.id);
    router.push(resolveNotificationUrl(notification.event_key, notification.payload));
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground">الإشعارات</h1>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {unreadCount} جديد
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isMarkingAllRead}
            onClick={() => markAllRead()}
          >
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("all")}
        >
          الكل
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("unread")}
        >
          غير مقروء
        </Button>
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col items-center justify-center px-6 py-14 text-center text-sm text-muted-foreground">
          جارٍ التحميل...
        </div>
      ) : items.length === 0 ? (
        <div className="flex w-full flex-col items-center justify-center px-6 py-14 text-center text-sm text-muted-foreground">
          {filter === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات حتى الآن"}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onOpen={openNotification}
              />
            ))}
          </div>
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="self-center"
            >
              {isFetching ? "جارٍ التحميل..." : "تحميل المزيد"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
