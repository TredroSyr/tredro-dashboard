"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const EVENT_ICON: Record<string, iconName> = {
  customer_request: "list_outlined",
  stock_transfer: "folder_outlined",
};

const getEventIcon = (eventKey: string): iconName =>
  EVENT_ICON[eventKey.split(".")[0]] ?? "notification_outlined";

const FILTER_LABEL: Record<"all" | "unread", string> = {
  all: "الكل",
  unread: "غير مقروء",
};

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
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
}) {
  const isUnread = !notification.is_read;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60",
        isUnread && "bg-primary/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <IconRenderer name={getEventIcon(notification.event_key)} className="size-4" />
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
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{notification.body}</p>
      </div>

      <span className="mt-0.5 shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDistanceToNowStrict(new Date(notification.created_at), {
          addSuffix: true,
          locale: ar,
        })}
      </span>
    </button>
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
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

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
  const isInboxZero = filter === "unread" && !isLoading && items.length === 0;

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
            onClick={() => setConfirmClearOpen(true)}
          >
            <IconRenderer name="tick_outlined" className="size-4" />
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="sm" className="self-start">
            <IconRenderer name="filter_outlined" className="size-3.5" />
            {FILTER_LABEL[filter]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={filter}
            onValueChange={(value) => handleFilterChange(value as "all" | "unread")}
          >
            <DropdownMenuRadioItem value="all">الكل</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unread">غير مقروء</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
              لاحقاً من تبويب «الكل».
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
