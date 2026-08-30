"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useRepsQuery } from "@/module/reps/hooks";
import { useOverdueReportQuery } from "../hooks";
import { formatDate, formatMoney, formatRepName } from "../lib/format";
import { cn } from "@/lib/utils";

type OverdueSubTab = "reps" | "customers";

const SUB_TABS: { value: OverdueSubTab; label: string; icon: iconName }[] = [
  { value: "reps", label: "حسب المندوب", icon: "users_outlined" },
  { value: "customers", label: "حسب الزبون", icon: "user_outlined" },
];

export function OverdueReportView() {
  const [subTab, setSubTab] = React.useState<OverdueSubTab>("customers");
  const [thresholdInput, setThresholdInput] = React.useState("");
  const [rep, setRep] = React.useState("");
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  const thresholdDays = thresholdInput ? Number(thresholdInput) : undefined;

  const { data, isLoading, isError, refetch } = useOverdueReportQuery({
    threshold_days: thresholdDays,
    rep: rep || undefined,
  });
  const report = data?.data?.report;

  const { data: repsRes } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const byRep = [...(report?.by_rep ?? [])].sort(
    (a, b) => Number(b.total_balance_due) - Number(a.total_balance_due),
  );
  const byCustomer = [...(report?.by_customer ?? [])].sort(
    (a, b) => Number(b.total_balance_due) - Number(a.total_balance_due),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          الديون المتأخرة
          {report && <Badge className="font-normal">{report.totals.invoice_count} فاتورة</Badge>}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <SearchableSelect
            options={repOptions}
            value={rep}
            onChange={setRep}
            placeholder="كل المناديب"
            searchPlaceholder="ابحث عن مندوب..."
            className="h-8 w-[160px] rounded-lg"
          />
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              العتبة (أيام)
            </span>
            <Input
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value.replace(/\D/g, ""))}
              placeholder={String(report?.overdue_threshold_days ?? 7)}
              inputMode="numeric"
              dir="ltr"
              className="h-8 w-16"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2" dir="rtl">
        {SUB_TABS.map((tab) => {
          const isActive = subTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSubTab(tab.value)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <IconRenderer name={tab.icon} className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-10 text-center text-sm text-muted-foreground">
          حدث خطأ أثناء تحميل التقرير
          <button onClick={() => refetch()} className="text-primary hover:underline">
            إعادة المحاولة
          </button>
        </div>
      ) : subTab === "reps" ? (
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : byRep.length === 0 ? (
            <div className="rounded-xl border border-border py-10 text-center text-sm text-muted-foreground">
              لا توجد ديون متأخرة ضمن هذه الفلاتر
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byRep.map((r) => (
                <div
                  key={r.rep_id ?? "direct"}
                  className="rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        r.rep_name
                          ? "font-medium text-foreground"
                          : "font-medium text-muted-foreground italic"
                      }
                    >
                      {formatRepName(r.rep_name)}
                    </span>
                    <span className="tabular-nums font-semibold text-destructive">
                      {formatMoney(r.total_balance_due)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {r.invoice_count} فاتورة متأخرة
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))
          ) : byCustomer.length === 0 ? (
            <div className="rounded-xl border border-border py-10 text-center text-sm text-muted-foreground">
              لا توجد ديون متأخرة ضمن هذه الفلاتر
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-xl border border-border">
              {byCustomer.map((c) => {
                const isOpen = expanded.has(c.customer_id);
                return (
                  <div key={c.customer_id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggle(c.customer_id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform motion-safe:duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                        <span className="font-medium text-foreground">
                          {c.customer_name}
                        </span>
                        <Badge variant="outline">{c.invoice_count}</Badge>
                      </div>
                      <span className="tabular-nums font-semibold text-destructive">
                        {formatMoney(c.total_balance_due)}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="flex flex-col gap-1.5 bg-muted/20 px-4 py-3">
                        {c.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-foreground">
                              {inv.number} · {formatDate(inv.date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="tabular-nums text-muted-foreground">
                                متأخرة {inv.days_overdue} يوم
                              </span>
                              <span className="tabular-nums font-medium text-foreground">
                                {formatMoney(inv.balance_due)}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
