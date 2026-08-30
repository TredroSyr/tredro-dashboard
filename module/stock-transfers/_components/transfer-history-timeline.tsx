"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useStockTransferHistoryQuery } from "../hooks";
import { formatDateTime } from "../lib/format";

const ACTOR_LABEL: Record<string, string> = {
  subuser: "موظف",
  rep: "مندوب",
};

const ACTION_LABEL: Record<string, string> = {
  requested: "طلب البضاعة",
  approved: "الموافقة على الطلب",
  modified: "تعديل الكميات",
  awaiting_rep_confirmation: "بانتظار موافقة المندوب",
  rep_confirmed: "المندوب وافق على الكميات",
  rejected: "المندوب رفض الطلب",
  received: "تم الاستلام — تحرّك المخزون",
  cancelled: "إلغاء الطلب",
};

export function TransferHistoryTimeline({ transferId }: { transferId: number }) {
  const { data, isLoading, isError } = useStockTransferHistoryQuery(transferId);
  const entries = data?.data?.history ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        تعذّر تحميل سجلّ الطلب
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        لا يوجد سجلّ لهذا الطلب بعد
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconRenderer name="activity_log_outlined" className="size-3.5" />
            </span>
            <span className="mt-1 w-px flex-1 bg-border" />
          </div>
          <div className="flex flex-col gap-0.5 pb-4">
            <span className="text-sm font-medium text-foreground">
              {ACTION_LABEL[entry.action] ?? entry.action}
            </span>
            <span className="text-xs text-muted-foreground">
              {ACTOR_LABEL[entry.actor_type] ?? entry.actor_type} ·{" "}
              {formatDateTime(entry.created_at)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
