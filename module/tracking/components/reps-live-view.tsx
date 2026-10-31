"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { useRepsQuery } from "@/module/reps/hooks";
import { buildRepDay } from "../lib/dummy-day";
import { ACTIVITY_META, REP_COLORS, STATUS_META, formatAgo, toDateKey } from "../lib/geo";
import { useCompanyCurrency, useNow, useTrackingCenter } from "../hooks";
import type { RepDaySnapshot, RepLiveStatus } from "../types";
import { TrackingMap, type MapTrack } from "./tracking-map";

/** Reps in the field first, then the ones done for the day, then the rest. */
const STATUS_ORDER: Record<RepLiveStatus, number> = {
  at_customer: 0,
  moving: 1,
  finished: 2,
  not_started: 3,
  offline: 4,
};

interface RepRow {
  id: string;
  name: string;
  color: string;
  day: RepDaySnapshot;
}

function useRepsLive() {
  const now = useNow(30_000);
  const center = useTrackingCenter();
  const { data, isLoading } = useRepsQuery();
  const date = toDateKey(new Date(now));
  const reps = data?.data?.reps;

  const rows: RepRow[] = useMemo(
    () =>
      (reps ?? [])
        .map((rep, i) => ({
          id: String(rep.id),
          name: rep.name,
          color: REP_COLORS[i % REP_COLORS.length],
          day: buildRepDay({ repId: String(rep.id), date, center, at: now, active: rep.is_active }),
        }))
        .sort((a, b) => STATUS_ORDER[a.day.status] - STATUS_ORDER[b.day.status]),
    [reps, date, center, now],
  );

  return { rows, now, center, date, isLoading };
}

function summarize(rows: RepRow[]) {
  return rows.reduce(
    (acc, r) => {
      if (r.day.status === "moving" || r.day.status === "at_customer") acc.field++;
      if (r.day.status === "finished") acc.finished++;
      acc.visits += r.day.stats.visits;
      acc.planned += r.day.stats.planned;
      acc.sales += r.day.stats.salesTotal;
      acc.collections += r.day.stats.collectionsTotal;
      return acc;
    },
    { field: 0, finished: 0, visits: 0, planned: 0, sales: 0, collections: 0 },
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-2.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

/** Full-page "all reps right now" view: status list on the start side, big map beside it. */
export function RepsLiveView() {
  const { rows, now, center, date, isLoading } = useRepsLive();
  const currency = useCompanyCurrency();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number } | null>(null);

  const tracks: MapTrack[] = useMemo(
    () =>
      rows
        .filter((r) => r.day.position)
        .map((r) => ({
          id: r.id,
          color: r.color,
          path: r.day.path,
          position: r.day.position,
          label: r.name,
          live: r.day.status === "moving" || r.day.status === "at_customer",
          highlighted: r.id === activeId,
          dimmed: activeId != null && r.id !== activeId,
        })),
    [rows, activeId],
  );

  const counts = summarize(rows);

  const toggleRep = (row: RepRow) => {
    const next = activeId === row.id ? null : row.id;
    setActiveId(next);
    const pos = row.day.position;
    if (next && pos) setFocus((f) => ({ lat: pos.lat, lng: pos.lng, key: (f?.key ?? 0) + 1 }));
  };

  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col lg:h-svh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/reps"
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="رجوع للمناديب"
          >
            <IconRenderer name="arrow_right_outlined" className="size-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              تتبع المناديب
              <LiveDot />
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isLoading
                ? "…"
                : `${counts.field} بالميدان · ${counts.finished} أنهوا يومهم · ${counts.visits}/${counts.planned} زيارة اليوم`}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          <SummaryStat label="مبيعات اليوم" value={formatMoney(counts.sales, currency)} />
          <SummaryStat label="تحصيل اليوم" value={formatMoney(counts.collections, currency)} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(280px,50%)_1fr] lg:grid-cols-[minmax(320px,380px)_1fr] lg:grid-rows-1">
        <ul className="order-2 min-h-0 space-y-1 overflow-y-auto border-border p-2 lg:order-1 lg:border-e">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                </li>
              ))
            : rows.length === 0
              ? <li className="py-10 text-center text-sm text-muted-foreground">لا يوجد مناديب بعد</li>
              : rows.map((row) => (
                  <RepLiveRow
                    key={row.id}
                    row={row}
                    now={now}
                    currency={currency}
                    active={row.id === activeId}
                    onClick={() => toggleRep(row)}
                  />
                ))}
        </ul>

        <div className="relative order-1 min-h-0 lg:order-2">
          <TrackingMap
            className="absolute inset-0"
            center={center}
            tracks={tracks}
            onTrackClick={(id) => {
              const row = rows.find((r) => r.id === id);
              if (row) toggleRep(row);
            }}
            fitKey={`all|${date}|${rows.length}`}
            focus={focus}
          />
          {activeId && (
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="absolute top-3 right-3 z-[1000] rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted"
            >
              عرض كل المناديب
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Home-page quick access: a one-line live summary that opens the tracking page. */
export function RepsTrackingShortcut() {
  const { rows, isLoading } = useRepsLive();
  const counts = summarize(rows);
  return (
    <Link
      href="/reps/tracking"
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 no-underline transition-colors hover:border-primary/40 hover:bg-primary/5 hover:no-underline sm:px-5"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <IconRenderer name="location_outlined" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          تتبع المناديب مباشرة
          <LiveDot />
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {isLoading
            ? "…"
            : `${counts.field} بالميدان الآن · ${counts.visits}/${counts.planned} زيارة اليوم · وين كل مندوب وشو عمل`}
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
        فتح الخريطة
        <IconRenderer name="arrow_left_outlined" className="size-4 transition-transform group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  );
}

function RepLiveRow({
  row,
  now,
  currency,
  active,
  onClick,
}: {
  row: RepRow;
  now: number;
  currency: string;
  active: boolean;
  onClick: () => void;
}) {
  const { day } = row;
  const status = STATUS_META[day.status];
  const lastWork = [...day.activities].reverse().find((a) => a.type !== "day_end" || day.status === "finished");
  const progress = day.stats.planned ? day.stats.visits / day.stats.planned : 0;

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        className={cn(
          "group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors",
          active ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/50",
        )}
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ background: day.position ? row.color : "#94a3b8" }}
        >
          {row.name.trim().charAt(0)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", status.className)}>
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {day.status === "at_customer" && day.currentCustomer
              ? `عند ${day.currentCustomer}`
              : lastWork
                ? `${ACTIVITY_META[lastWork.type].label}${lastWork.customerName ? ` · ${lastWork.customerName}` : ""} · ${formatAgo(lastWork.time, now)}`
                : day.status === "offline"
                  ? "الحساب غير مفعّل"
                  : "لا يوجد نشاط اليوم"}
          </div>
          {day.stats.planned > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%`, background: row.color }} />
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {day.stats.visits}/{day.stats.planned}
              </span>
              {day.stats.salesTotal > 0 && (
                <span className="shrink-0 text-[10px] font-semibold text-foreground">
                  {formatMoney(day.stats.salesTotal, currency)}
                </span>
              )}
            </div>
          )}
        </div>

        <Link
          href={`/reps/detail?id=${row.id}&tab=tracking`}
          onClick={(e) => e.stopPropagation()}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-70 transition hover:bg-muted hover:text-primary group-hover:opacity-100"
          aria-label={`تتبع ${row.name}`}
          title="فتح تتبع المندوب"
        >
          <IconRenderer name="external_outlined" className="size-4" />
        </Link>
      </div>
    </li>
  );
}
