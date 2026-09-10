"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "../hooks";
import { resolveNotificationUrl } from "../lib/notification-routing";
import { Notification } from "../types";

type ReadStatus = "unread" | "read";

/** Distinct icon + color per event key so notification types are visually scannable at a glance. */
const EVENT_CONFIG: Record<string, { icon: iconName; badgeClass: string }> = {
  "customer_request.created": {
    icon: "list_outlined",
    badgeClass: "bg-sky-500/10 text-sky-600",
  },
  "customer_request.accepted": {
    icon: "tick_outlined",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
  },
  "customer_request.rejected": {
    icon: "close_outlined",
    badgeClass: "bg-red-500/10 text-red-600",
  },
  "stock_transfer.requested": {
    icon: "cart_outlined",
    badgeClass: "bg-amber-500/10 text-amber-600",
  },
  "stock_transfer.dispatched": {
    icon: "send_outlined",
    badgeClass: "bg-blue-500/10 text-blue-600",
  },
  "stock_transfer.modified": {
    icon: "edit_outlined",
    badgeClass: "bg-violet-500/10 text-violet-600",
  },
  "stock_transfer.confirmed": {
    icon: "success_outlined",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
  },
  "stock_transfer.received": {
    icon: "download_outlined",
    badgeClass: "bg-teal-500/10 text-teal-600",
  },
  "stock_transfer.cancelled": {
    icon: "block_outlined",
    badgeClass: "bg-rose-500/10 text-rose-600",
  },
};

const DEFAULT_EVENT_CONFIG: { icon: iconName; badgeClass: string } = {
  icon: "notification_outlined",
  badgeClass: "bg-muted text-muted-foreground",
};

const getEventConfig = (eventKey: string) => EVENT_CONFIG[eventKey] ?? DEFAULT_EVENT_CONFIG;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getSenderInfo(payload: Record<string, unknown>): { name?: string; avatar?: string } {
  const name = typeof payload.sender_name === "string" ? payload.sender_name : undefined;
  const avatar =
    typeof payload.sender_avatar === "string"
      ? payload.sender_avatar
      : typeof payload.avatar_url === "string"
        ? payload.avatar_url
        : undefined;
  return { name, avatar };
}

const QUOTES = [
  { text: "لا تنتظر اللحظة المثالية، اصنعها بنفسك.", author: "مجهول" },
  { text: "النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم.", author: "روبرت كولير" },
  { text: "ابدأ من حيث أنت، استخدم ما لديك، وافعل ما تستطيع.", author: "آرثر آش" },
];

function getDateGroupLabel(date: Date): string {
  if (isToday(date)) return "اليوم";
  if (isYesterday(date)) return "أمس";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "MMMM" : "MMMM yyyy", { locale: ar });
}

function groupByDate(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  for (const notification of items) {
    const label = getDateGroupLabel(new Date(notification.created_at));
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.label === label) {
      lastGroup.items.push(notification);
    } else {
      groups.push({ label, items: [notification] });
    }
  }
  return groups;
}

function NotificationRow({
  notification,
  onOpen,
  onMarkRead,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onMarkRead: (id: number) => void;
}) {
  const isUnread = !notification.is_read;
  const { icon, badgeClass } = getEventConfig(notification.event_key);
  const sender = getSenderInfo(notification.payload);
  const initials = sender.name ? getInitials(sender.name) : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(notification);
        }
      }}
      className={cn(
        "group/row flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-start transition-colors hover:bg-muted/60 sm:gap-3 sm:px-4",
        isUnread && "bg-primary/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          badgeClass,
        )}
      >
        <IconRenderer name={icon} className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm",
              isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80",
            )}
          >
            {notification.title}
          </p>
          {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1.5">
          <Avatar size="sm" className="shrink-0">
            {sender.avatar && <AvatarImage src={sender.avatar} alt={sender.name ?? ""} />}
            <AvatarFallback size="sm" className="text-[10px] font-semibold">
              {initials ?? <IconRenderer name="user_outlined" className="size-3" />}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm text-muted-foreground">{notification.body}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-xs whitespace-nowrap text-muted-foreground tabular-nums group-hover/row:sm:hidden sm:inline">
          {formatDistanceToNowStrict(new Date(notification.created_at), {
            addSuffix: true,
            locale: ar,
          })}
        </span>

        {isUnread && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden group-hover/row:inline-flex"
            title="تحديد كمقروء"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead(notification.id);
            }}
          >
            <IconRenderer name="tick_outlined" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <IconRenderer name="notification_outlined" className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">لا توجد إشعارات حتى الآن</p>
    </div>
  );
}

function InboxZeroState() {
  const [quote] = React.useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const confettiDots = React.useMemo(
    () => [
      "top-2 start-8 bg-primary/60",
      "top-10 start-2 bg-orange-400/70",
      "top-4 end-6 bg-green-500/60",
      "top-14 end-2 bg-primary/40",
      "bottom-6 start-10 bg-orange-400/50",
      "bottom-2 end-10 bg-green-500/50",
      "top-1/2 start-1 bg-primary/50",
      "top-1/2 end-1 bg-orange-400/60",
    ],
    [],
  );

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="relative flex size-20 items-center justify-center">
        {confettiDots.map((position, index) => (
          <span
            key={index}
            aria-hidden
            className={cn("absolute size-1.5 rounded-full", position)}
          />
        ))}
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconRenderer name="mail_outlined" className="size-7" />
        </span>
      </div>

      <h2 className="text-base font-bold text-foreground">لا شيء ينتظرك الآن</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        أحسنت! لقد اطّلعت على جميع الإشعارات المهمة 🎉
      </p>

      <div className="mt-4 flex max-w-sm flex-col items-center gap-2 rounded-xl bg-muted/50 px-5 py-4">
        <Badge variant="secondary">اقتباس ملهم</Badge>
        <p className="text-sm leading-6 text-foreground/90">«{quote.text}»</p>
        <p className="text-xs text-muted-foreground">— {quote.author}</p>
      </div>
    </div>
  );
}

export default function NotificationsView() {
  const router = useRouter();
  const [status, setStatus] = React.useState<ReadStatus>("unread");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

  const { data, isLoading, isFetching } = useNotificationsQuery({
    unread: status === "unread",
    page,
  });

  React.useEffect(() => {
    if (!data) return;
    setItems((prev) =>
      page === 1 ? data.data.notifications : [...prev, ...data.data.notifications],
    );
  }, [data, page]);

  const handleStatusChange = (value: ReadStatus) => {
    setStatus(value);
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

  const handleConfirmClear = () => {
    markAllRead(undefined, {
      onSuccess: () => {
        setConfirmClearOpen(false);
        toast.success("تم تحديد جميع الإشعارات كمقروءة");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const groups = groupByDate(items);
  const isInboxZero = status === "unread" && !isLoading && items.length === 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-foreground">الإشعارات</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isMarkingAllRead}
            onClick={() => setConfirmClearOpen(true)}
          >
            <IconRenderer name="tick_outlined" className="size-4" />
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Tabs
          value={status}
          onValueChange={(value) => handleStatusChange(value as ReadStatus)}
        >
          <TabsList variant="line" className="w-fit">
            <TabsTrigger value="unread" className="gap-1.5">
              غير مقروء
              {unreadCount > 0 && (
                <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary/15 px-1 text-[11px] font-semibold text-primary tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">مقروء</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <NotificationsSkeleton />
      ) : isInboxZero ? (
        <InboxZeroState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                  {group.label}
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onOpen={openNotification}
                      onMarkRead={markRead}
                    />
                  ))}
                </div>
              </div>
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

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تحديد كل الإشعارات كمقروءة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم تحديد جميع الإشعارات ({unreadCount}) كمقروءة، ويمكنك الاطلاع عليها
              لاحقاً من تبويب «مقروء».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction disabled={isMarkingAllRead} onClick={handleConfirmClear}>
              {isMarkingAllRead ? "جارٍ التحديد..." : "تحديد الكل كمقروء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
