"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { dummyNotifications } from "../data/dummy-notifications";
import { NotificationItem, NotificationKind } from "../types";

const KIND_ICON: Record<NotificationKind, iconName> = {
  order: "list_outlined",
  invoice: "payment_outlined",
  stock_transfer: "folder_outlined",
  system: "notification_outlined",
};

function NotificationCard({
  notification,
  onToggleRead,
}: {
  notification: NotificationItem;
  onToggleRead: (id: number) => void;
}) {
  return (
    <Card
      onClick={() => onToggleRead(notification.id)}
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
        <IconRenderer name={KIND_ICON[notification.kind]} className="h-4 w-4" />
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
  const [notifications, setNotifications] = React.useState(dummyNotifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: !n.is_read } : n)),
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex w-full flex-col items-center justify-center px-6 py-14 text-center text-sm text-muted-foreground">
          لا توجد إشعارات حتى الآن
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onToggleRead={toggleRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
