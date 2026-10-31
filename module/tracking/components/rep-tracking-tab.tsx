"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { buildRepDay } from "../lib/dummy-day";
import {
  ACTIVITY_META,
  STATUS_META,
  formatAgo,
  formatDayLabel,
  formatDuration,
  formatTime,
  shiftDateKey,
  toDateKey,
} from "../lib/geo";
import { useCompanyCurrency, useNow, useTrackingCenter } from "../hooks";
import type { RepActivity, RepActivityType } from "../types";
import { TrackingMap, type MapStop, type MapTrack } from "./tracking-map";

const REP_COLOR = "#1d4ed8";
const REPLAY_STEP_MS = 2 * 60_000;

const ACTIVITY_ICON: Record<RepActivityType, iconName> = {
  day_start: "start_outlined",
  invoice: "payment_outlined",
  collection: "money_outlined",
  return: "undo_outlined",
  new_customer: "add_user_outlined",
  no_sale: "block_outlined",
  day_end: "flag_outlined",
};

/** The visit pin takes the color of the "most telling" thing that happened there. */
const STOP_PRIORITY: RepActivityType[] = ["no_sale", "return", "invoice", "collection", "new_customer"];

function buildStops(activities: RepActivity[], currency: string, selectedId: string | null) {
  const byVisit = new Map<number, RepActivity[]>();
  activities.forEach((a) => {
    if (a.visitIndex == null) return;
    byVisit.set(a.visitIndex, [...(byVisit.get(a.visitIndex) ?? []), a]);
  });

  let selectedStopId: string | null = null;
  const stops: MapStop[] = [...byVisit.entries()].map(([index, items]) => {
    const main =
      STOP_PRIORITY.map((type) => items.find((a) => a.type === type)).find(Boolean) ?? items[0];
    const id = `visit-${index}`;
    if (items.some((a) => a.id === selectedId)) selectedStopId = id;
    const lines = items
      .map(
        (a) =>
          `${formatTime(a.time)} · ${ACTIVITY_META[a.type].label}${
            a.amount ? ` ${formatMoney(a.amount, currency)}` : ""
          }`,
      )
      .join("<br/>");
    return {
      id,
      lat: main.lat,
      lng: main.lng,
      badge: String(index),
      color: ACTIVITY_META[main.type].color,
      tooltip: `<b>${index}. ${items[0].customerName ?? ""}</b><br/><small>${lines}</small>`,
    };
  });
  return { stops, selectedStopId };
}

export function RepTrackingTab({ repId, isActive = true }: { repId: string; isActive?: boolean }) {
  const now = useNow(30_000);
  const center = useTrackingCenter();
  const currency = useCompanyCurrency();
  const today = toDateKey(new Date(now));
  const [date, setDate] = useState(today);
  const [replayAt, setReplayAt] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  const isToday = date === today;
  const isFuture = date > today;
  // Live edge: right now for today, the whole day for past days.
  const liveAt = isToday ? now : isFuture ? 0 : Number.MAX_SAFE_INTEGER;

  const live = useMemo(
    () => buildRepDay({ repId, date, center, at: liveAt, active: isActive }),
    [repId, date, center, liveAt, isActive],
  );
  const viewAt = replayAt ?? liveAt;
  const day = useMemo(
    () => (replayAt == null ? live : buildRepDay({ repId, date, center, at: viewAt, active: isActive })),
    [live, replayAt, repId, date, center, viewAt, isActive],
  );

  const sliderMin = live.dayStart ?? 0;
  const sliderMax = Math.min(live.dayEnd ?? 0, liveAt);
  const canReplay = live.activities.length > 0 && sliderMax > sliderMin;

  const goToDate = (next: string) => {
    setDate(next);
    setReplayAt(null);
    setPlaying(false);
    setSelectedId(null);
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setReplayAt((t) => {
        const next = (t ?? sliderMin) + REPLAY_STEP_MS;
        if (next >= sliderMax) {
          setPlaying(false);
          return null;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(id);
  }, [playing, sliderMin, sliderMax]);

  const { stops, selectedStopId } = useMemo(
    () => buildStops(day.activities, currency, selectedId),
    [day.activities, currency, selectedId],
  );

  const tracks: MapTrack[] = useMemo(
    () => [
      {
        id: repId,
        color: REP_COLOR,
        path: day.path,
        position: day.status === "finished" ? null : day.position,
        live: isToday && replayAt == null && (day.status === "moving" || day.status === "at_customer"),
      },
    ],
    [repId, day.path, day.position, day.status, isToday, replayAt],
  );

  const depot = live.activities[0]?.type === "day_start" ? ([live.activities[0].lat, live.activities[0].lng] as [number, number]) : null;

  const selectActivity = (activity: RepActivity) => {
    setSelectedId(activity.id);
    setFocus((f) => ({ lat: activity.lat, lng: activity.lng, key: (f?.key ?? 0) + 1 }));
  };

  const selectStop = (stopId: string) => {
    const index = Number(stopId.replace("visit-", ""));
    const activity = day.activities.find((a) => a.visitIndex === index);
    if (!activity) return;
    setSelectedId(activity.id);
    logRef.current
      ?.querySelector(`[data-activity="${activity.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const status = STATUS_META[isFuture ? "not_started" : day.status];
  const { stats } = day;
  const workSpan =
    stats.firstActivity && stats.lastActivity ? stats.lastActivity - stats.firstActivity : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Day picker + live status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => goToDate(shiftDateKey(date, -1))} aria-label="اليوم السابق">
            <ChevronRight />
          </Button>
          <div className="min-w-40 text-center">
            <div className="text-sm font-semibold text-foreground">{formatDayLabel(date)}</div>
            <div className="text-[11px] text-muted-foreground">
              {isToday ? "اليوم" : isFuture ? "يوم قادم — الزبائن المخطط لهم" : "سجل يوم سابق"}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToDate(shiftDateKey(date, 1))}
            disabled={isToday}
            aria-label="اليوم التالي"
          >
            <ChevronLeft />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => goToDate(today)}>
              رجوع لليوم
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>
            <span className={cn("size-1.5 rounded-full", status.dot, isToday && day.status !== "finished" && day.status !== "offline" && "animate-pulse")} />
            {status.label}
            {day.status === "at_customer" && day.currentCustomer ? ` · ${day.currentCustomer}` : ""}
          </span>
          {isToday && stats.lastActivity && replayAt == null && (
            <span className="text-xs text-muted-foreground">آخر نشاط {formatAgo(stats.lastActivity, now)}</span>
          )}
        </div>
      </div>

      {/* Day stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile icon="location_outlined" label="الزيارات" value={`${stats.visits}/${stats.planned}`} sub="من الزبائن المخطط لهم" progress={stats.planned ? stats.visits / stats.planned : 0} />
        <StatTile icon="revenue_outlined" label="المبيعات" value={formatMoney(stats.salesTotal, currency)} sub={`${stats.invoicesCount} فاتورة`} />
        <StatTile icon="money_outlined" label="التحصيل" value={formatMoney(stats.collectionsTotal, currency)} sub={stats.returnsTotal ? `مرتجع ${formatMoney(stats.returnsTotal, currency)}` : "بدون مرتجعات"} />
        <StatTile icon="map_outlined" label="المسافة المقطوعة" value={`${stats.distanceKm} كم`} sub="حسب مسار GPS" />
        <StatTile icon="clock_outlined" label="ساعات العمل" value={workSpan ? formatDuration(workSpan) : "—"} sub={stats.firstActivity ? `من ${formatTime(stats.firstActivity)}` : "لم يبدأ"} />
        <StatTile icon="time_outlined" label="آخر نشاط" value={stats.lastActivity ? formatTime(stats.lastActivity) : "—"} sub={day.activities.length ? ACTIVITY_META[day.activities[day.activities.length - 1].type].label : "لا يوجد"} />
      </div>

      {/* Log (start side) + map */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
        <div className="order-2 flex max-h-[620px] min-h-[320px] flex-col rounded-2xl border border-border bg-card lg:order-1">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">سجل النشاط</h3>
            <span className="text-xs text-muted-foreground">{day.activities.length} حدث</span>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto p-2">
            {day.activities.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {isFuture || day.status === "not_started" ? "لم يبدأ المندوب يومه بعد" : "لا يوجد نشاط لهذا اليوم"}
              </p>
            ) : (
              <ol className="relative">
                {day.activities.map((activity, i) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    currency={currency}
                    selected={activity.id === selectedId}
                    last={i === day.activities.length - 1}
                    onClick={() => selectActivity(activity)}
                  />
                ))}
              </ol>
            )}

            {day.unvisited.length > 0 && (
              <div className="mt-2 border-t border-dashed border-border px-2 pt-3">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">
                  {day.status === "finished" ? "لم تتم زيارتهم" : "بانتظار الزيارة"} ({day.unvisited.length})
                </div>
                <ul className="space-y-1">
                  {day.unvisited.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setFocus((f) => ({ lat: c.lat, lng: c.lng, key: (f?.key ?? 0) + 1 }))}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right text-xs text-muted-foreground hover:bg-muted/50"
                      >
                        <span className="size-2.5 shrink-0 rounded-full border-2 border-slate-400 bg-white" />
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="order-1 relative h-[420px] overflow-hidden rounded-2xl border border-border lg:order-2 lg:h-[620px]">
          <TrackingMap
            className="absolute inset-0"
            center={center}
            tracks={tracks}
            stops={stops}
            planned={day.unvisited}
            depot={depot}
            selectedStopId={selectedStopId}
            onStopClick={selectStop}
            fitKey={`${repId}|${date}`}
            focus={focus}
          />

          <MapLegend />

          {canReplay && (
            <div className="absolute inset-x-3 bottom-3 z-[1000] flex items-center gap-3 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
              <Button
                size="icon-sm"
                onClick={() => {
                  if (!playing && replayAt == null) setReplayAt(sliderMin);
                  setPlaying((p) => !p);
                }}
                aria-label={playing ? "إيقاف" : "إعادة تشغيل اليوم"}
              >
                {playing ? <Pause /> : <Play />}
              </Button>
              <input
                type="range"
                dir="ltr"
                min={sliderMin}
                max={sliderMax}
                step={60_000}
                value={Math.min(viewAt, sliderMax)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPlaying(false);
                  setReplayAt(v >= sliderMax ? null : v);
                }}
                className="h-1.5 flex-1 cursor-pointer accent-primary"
                aria-label="إعادة عرض اليوم"
              />
              <span className="w-16 shrink-0 text-center text-xs font-semibold tabular-nums text-foreground">
                {formatTime(Math.min(viewAt, sliderMax))}
              </span>
              {replayAt != null && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPlaying(false);
                    setReplayAt(null);
                  }}
                >
                  {isToday ? "مباشر" : "كامل اليوم"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
  currency,
  selected,
  last,
  onClick,
}: {
  activity: RepActivity;
  currency: string;
  selected: boolean;
  last: boolean;
  onClick: () => void;
}) {
  const meta = ACTIVITY_META[activity.type];
  return (
    <li data-activity={activity.id} className="relative">
      {!last && <span className="absolute top-9 bottom-0 right-[22px] w-px bg-border" />}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl px-2 py-2 text-right transition-colors",
          selected ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/50",
        )}
      >
        <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full", meta.soft)}>
          <IconRenderer name={ACTIVITY_ICON[activity.type]} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {activity.visitIndex != null && (
                <span className="ml-1 text-xs text-muted-foreground">{activity.visitIndex}.</span>
              )}
              {meta.label}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{formatTime(activity.time)}</span>
          </span>
          {activity.customerName && (
            <span className="block truncate text-xs text-muted-foreground">{activity.customerName}</span>
          )}
          {(activity.amount || activity.note) && (
            <span className="mt-0.5 flex items-center gap-2 text-xs">
              {activity.amount ? (
                <span className="font-semibold" style={{ color: meta.color }}>
                  {activity.type === "return" ? "−" : ""}
                  {formatMoney(activity.amount, currency)}
                </span>
              ) : null}
              {activity.note && <span className="truncate text-muted-foreground">{activity.note}</span>}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: iconName;
  label: string;
  value: string;
  sub: string;
  progress?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconRenderer name={icon} className="size-3.5" />
        {label}
      </div>
      <div className="mt-1.5 truncate text-base font-semibold text-foreground tabular-nums">{value}</div>
      {progress != null ? (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      ) : (
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

const LEGEND: RepActivityType[] = ["invoice", "collection", "return", "no_sale"];

function MapLegend() {
  return (
    <div className="absolute top-3 right-3 z-[1000] hidden flex-col gap-1 rounded-xl border border-border bg-card/95 px-3 py-2 text-[11px] shadow-sm backdrop-blur sm:flex">
      {LEGEND.map((type) => (
        <span key={type} className="flex items-center gap-1.5 text-foreground">
          <span className="size-2.5 rounded-full" style={{ background: ACTIVITY_META[type].color }} />
          {ACTIVITY_META[type].label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2.5 rounded-full border-2 border-slate-400 bg-white" />
        لم تتم زيارته
      </span>
    </div>
  );
}
