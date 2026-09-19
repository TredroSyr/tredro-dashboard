"use client";

import { useEffect, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight, InsightSeverity } from "@/module/dashboard/types";

// The client owns the icon (Insights.md §2) — the server only sends `kind`.
const KIND_ICON: Record<string, iconName> = {
  orders_forecast: "cart_outlined",
  sales_forecast: "revenue_outlined",
  collection_rate: "transaction_outlined",
  overdue_pressure: "clock_outlined",
  returns_rate: "undo_outlined",
  coverage: "location_outlined",
  request_backlog: "report_outlined",
  top_performer: "star_outlined",
  customer_activity: "users_outlined",
  customer_dormant: "time_outlined",
};
const GENERIC_ICON: iconName = "info_outlined";

const SEVERITY_ICON_CLASS: Record<InsightSeverity, string> = {
  warning: "text-amber-200",
  positive: "text-emerald-200",
  neutral: "text-white/80",
};

const ROTATE_MS = 5000;

/** The card is shown while loading and when there is something to say; a failed or empty answer hides it. */
export function shouldShowInsights(isLoading: boolean, insights: Insight[]) {
  return isLoading || insights.length > 0;
}

export function InsightBannerSkeleton() {
  return (
    <div className="rounded-2xl bg-primary p-5 sm:p-6 h-full flex flex-col justify-between min-h-[220px]">
      <Skeleton className="h-5 w-32 bg-white/20" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40 bg-white/20" />
        <Skeleton className="h-3 w-full bg-white/20" />
        <Skeleton className="h-3 w-3/4 bg-white/20" />
      </div>
    </div>
  );
}

interface InsightBannerProps {
  insights: Insight[];
  isLoading?: boolean;
}

export function InsightBanner({ insights, isLoading }: InsightBannerProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (insights.length < 2) return;
    const id = setInterval(() => setActive((p) => (p + 1) % insights.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [insights.length]);

  if (isLoading) return <InsightBannerSkeleton />;
  if (insights.length === 0) return null;

  // The list can shrink between refetches (e.g. a new date range) while `active` still points past its end.
  const current = insights[active % insights.length];
  // The badge is only honest when a model actually wrote some of the wording.
  const aiWritten = insights.some((i) => i.source === "model");

  return (
    <div className="rounded-2xl bg-primary p-5 sm:p-6 text-primary-foreground relative overflow-hidden h-full flex flex-col justify-between min-h-[220px]">
      <div className="flex items-center justify-between">
        <span className="text-base sm:text-lg font-medium">توقعات وتنبؤات</span>
        {aiWritten && (
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1">
            <IconRenderer name="ai_outlined" className="size-3" />
            AI
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <IconRenderer
            name={KIND_ICON[current.kind] ?? GENERIC_ICON}
            className={`size-4 mt-0.5 shrink-0 ${SEVERITY_ICON_CLASS[current.severity] ?? SEVERITY_ICON_CLASS.neutral}`}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{current.title}</span>
            <p className="text-xs leading-relaxed text-white/80">{current.body}</p>
          </div>
        </div>
        {insights.length > 1 && (
          <div className="flex items-center gap-1.5">
            {insights.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`توقع ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active % insights.length ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
