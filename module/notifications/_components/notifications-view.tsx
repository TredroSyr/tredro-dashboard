"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  format,
} from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

/** Distinct icon + color + Arabic label per event key so notification types are visually scannable at a glance. */
const EVENT_CONFIG: Record<
  string,
  { icon: iconName; badgeClass: string; label: string }
> = {
  "customer_request.created": {
    icon: "plus_circle_outlined",
    badgeClass: "bg-sky-500/10 text-sky-600",
    label: "طلب عميل جديد",
  },
  "customer_request.accepted": {
    icon: "message_open_outlined",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
    label: "قبول طلب عميل",
  },
  "customer_request.rejected": {
    icon: "close_outlined",
    badgeClass: "bg-red-500/10 text-red-600",
    label: "رفض طلب عميل",
  },
  "stock_transfer.requested": {
    icon: "re_order_outlined",
    badgeClass: "bg-amber-500/10 text-amber-600",
    label: "طلب توريد بضاعة",
  },
  "stock_transfer.dispatched": {
    icon: "send_outlined",
    badgeClass: "bg-blue-500/10 text-blue-600",
    label: "إرسال الطلبية",
  },
  "stock_transfer.modified": {
    icon: "edit_outlined",
    badgeClass: "bg-violet-500/10 text-violet-600",
    label: "تعديل الطلبية",
  },
  "stock_transfer.confirmed": {
    icon: "success_outlined",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
    label: "تأكيد الطلبية",
  },
  "stock_transfer.received": {
    icon: "download_outlined",
    badgeClass: "bg-teal-500/10 text-teal-600",
    label: "استلام الطلبية",
  },
  "stock_transfer.cancelled": {
    icon: "block_outlined",
    badgeClass: "bg-rose-500/10 text-rose-600",
    label: "إلغاء الطلبية",
  },
};

const DEFAULT_EVENT_CONFIG: { icon: iconName; badgeClass: string } = {
  icon: "notification_outlined",
  badgeClass: "bg-muted text-muted-foreground",
};

const getEventConfig = (eventKey: string) => EVENT_CONFIG[eventKey];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getSenderInfo(payload: Record<string, unknown>): {
  name?: string;
  avatar?: string;
} {
  const name =
    typeof payload.sender_name === "string" ? payload.sender_name : undefined;
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
  {
    text: "النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم.",
    author: "روبرت كولير",
  },
  {
    text: "ابدأ من حيث أنت، استخدم ما لديك، وافعل ما تستطيع.",
    author: "آرثر آش",
  },
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

function StatusTab({
  icon,
  label,
  count,
  loading,
  active,
  onClick,
}: {
  icon: iconName;
  label: string;
  count?: number;
  loading?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex w-1/2  min-w-0 cursor-pointer items-center gap-2 px-3 py-5 text-start transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <IconRenderer name={icon} className="size-4 shrink-0" />
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span
          className={cn(
            "truncate text-sm",
            active ? "font-bold" : "font-medium",
          )}
        >
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-4 w-6 rounded-full" />
        ) : (
          count !== undefined &&
          count > 0 && (
            <span className="rounded-full bg-destructive/10 px-1.5 text-[11px] font-semibold text-destructive tabular-nums">
              {count > 99 ? "99+" : count}
            </span>
          )
        )}
      </span>
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
      )}
    </button>
  );
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
  const config = getEventConfig(notification.event_key);
  const icon = config?.icon ?? DEFAULT_EVENT_CONFIG.icon;
  const badgeClass = config?.badgeClass ?? DEFAULT_EVENT_CONFIG.badgeClass;
  const eventLabel = config?.label ?? notification.title;
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
        "group/row relative flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-start transition-colors hover:bg-muted/60 sm:gap-3 sm:px-4",
        isUnread && "bg-primary/[0.04]",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          badgeClass,
        )}
      >
        <IconRenderer name={icon} className="size-4" />
      </span>

      {/* Mobile: label row, then avatar+name row, then a full-width body row. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:hidden">
        <p
          className={cn(
            "truncate pe-28 text-sm",
            isUnread
              ? "font-semibold text-foreground"
              : "font-medium text-foreground/80",
          )}
        >
          {eventLabel}
        </p>

        {sender.name && (
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar size="sm" className="shrink-0">
              {sender.avatar && (
                <AvatarImage src={sender.avatar} alt={sender.name} />
              )}
              <AvatarFallback size="sm" className="text-[10px] font-semibold">
                {initials ?? (
                  <IconRenderer name="user_outlined" className="size-3" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-foreground/80">
              {sender.name}
            </span>
          </div>
        )}

        <p className="text-sm wrap-break-word text-muted-foreground">
          {notification.body}
        </p>
      </div>

      {/* Desktop: single truncated line - label, avatar, "name: body". */}
      <div className="hidden min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
        <p
          className={cn(
            "w-40 shrink-0 truncate text-sm",
            isUnread
              ? "font-semibold text-foreground"
              : "font-medium text-foreground/80",
          )}
        >
          {eventLabel}
        </p>

        <Avatar size="sm" className="shrink-0">
          {sender.avatar && (
            <AvatarImage src={sender.avatar} alt={sender.name ?? ""} />
          )}
          <AvatarFallback size="sm" className="text-[10px] font-semibold">
            {initials ?? (
              <IconRenderer name="user_outlined" className="size-3" />
            )}
          </AvatarFallback>
        </Avatar>

        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {sender.name && (
            <span
              title={sender.name}
              className="font-medium text-foreground/80"
            >
              {sender.name}
            </span>
          )}
          {sender.name && ": "}
          {notification.body}
        </p>
      </div>

      <div className="absolute inset-e-3 top-3 flex items-center gap-1 sm:static sm:inset-e-auto sm:top-auto sm:shrink-0">
        {isUnread && (
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        )}

        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs sm:group-hover/row:hidden">
          {formatDistanceToNowStrict(new Date(notification.created_at), {
            addSuffix: true,
            locale: ar,
          })}
        </span>

        {isUnread && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="inline-flex sm:hidden sm:group-hover/row:inline-flex"
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
        <div
          key={index}
          className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
        >
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
  const [quote] = React.useState(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
  );
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

      <h2 className="text-base font-bold text-foreground">
        لا شيء ينتظرك الآن
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        أحسنت! لقد اطّلعت على جميع الإشعارات المهمة
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
  const [eventKeyFilter, setEventKeyFilter] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

  const { data, isLoading, isFetching } = useNotificationsQuery({
    unread: status === "unread",
    event_key: eventKeyFilter.length ? eventKeyFilter.join(",") : undefined,
    page,
  });

  React.useEffect(() => {
    if (!data) return;
    setItems((prev) =>
      page === 1
        ? data.data.notifications
        : [...prev, ...data.data.notifications],
    );
  }, [data, page]);

  const handleStatusChange = (value: ReadStatus) => {
    setStatus(value);
    setPage(1);
  };

  const toggleEventFilter = (eventKey: string) => {
    setEventKeyFilter((prev) =>
      prev.includes(eventKey)
        ? prev.filter((key) => key !== eventKey)
        : [...prev, eventKey],
    );
    setPage(1);
  };

  const clearEventFilter = () => {
    setEventKeyFilter([]);
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
    router.push(
      resolveNotificationUrl(notification.event_key, notification.payload),
    );
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
    <div className="flex flex-col gap-4 ">
      <div className="sticky top-0 z-10  bg-card  ">
        <div
          role="tablist"
          className="flex border-b [&>button:not(:last-child)]:border-e"
        >
          <StatusTab
            icon="mail_outlined"
            label="غير مقروء"
            count={unreadCount}
            loading={isLoading && status === "unread"}
            active={status === "unread"}
            onClick={() => handleStatusChange("unread")}
          />
          <StatusTab
            icon="tick_outlined"
            label="مقروء"
            active={status === "read"}
            onClick={() => handleStatusChange("read")}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Popover>
              <PopoverTrigger>
                <Button
                  type="button"
                  variant={eventKeyFilter.length ? "secondary" : "outline"}
                  size="sm"
                  className="shrink-0 gap-1.5 rounded-full"
                >
                  <IconRenderer name="filter_outlined" className="size-3.5" />
                  تصفية
                  {eventKeyFilter.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-1.5 font-normal"
                    >
                      {eventKeyFilter.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="ابحث عن نوع الإشعار..." />
                  <CommandList>
                    <CommandEmpty>لا توجد نتائج</CommandEmpty>
                    <CommandGroup>
                      {Object.entries(EVENT_CONFIG).map(
                        ([eventKey, config]) => (
                          <CommandItem
                            key={eventKey}
                            value={`${config.label} ${eventKey}`}
                            onSelect={() => toggleEventFilter(eventKey)}
                            className="gap-2"
                          >
                            <Checkbox
                              checked={eventKeyFilter.includes(eventKey)}
                            />
                            <IconRenderer
                              name={config.icon}
                              className="size-4"
                            />
                            <span className="text-sm font-normal">
                              {config.label}
                            </span>
                          </CommandItem>
                        ),
                      )}
                    </CommandGroup>
                    {eventKeyFilter.length > 0 && (
                      <CommandGroup>
                        <CommandItem
                          onSelect={clearEventFilter}
                          className="justify-center text-center text-sm font-normal text-muted-foreground"
                        >
                          مسح الفلتر
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {eventKeyFilter.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearEventFilter}
                title="مسح الفلتر"
                className="shrink-0"
              >
                <IconRenderer name="close_outlined" className="size-3.5" />
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!unreadCount || isMarkingAllRead}
            onClick={() => setConfirmClearOpen(true)}
            title="تحديد الكل كمقروء"
            className="shrink-0 gap-1.5"
          >
            <IconRenderer name="tick_outlined" className="size-4" />
            <span className="hidden sm:inline">تحديد الكل كمقروء</span>
          </Button>
        </div>
      </div>
      <div className="p-4">
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
      </div>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تحديد كل الإشعارات كمقروءة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم تحديد جميع الإشعارات ({unreadCount}) كمقروءة، ويمكنك الاطلاع
              عليها لاحقاً من تبويب «مقروء».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMarkingAllRead}
              onClick={handleConfirmClear}
            >
              {isMarkingAllRead ? "جارٍ التحديد..." : "تحديد الكل كمقروء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
