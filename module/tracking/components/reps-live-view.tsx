"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CircleCheck, Maximize2, Receipt, Route } from "lucide-react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { useRepsQuery } from "@/module/reps/hooks";
import { buildRepDay } from "../lib/dummy-day";
import { ACTIVITY_META, STATUS_META, formatAgo, formatTime, toDateKey } from "../lib/geo";
import { PIN_ICONS } from "../lib/pin-icons";
import { useCompanyCurrency, useNow, useTrackingCenter } from "../hooks";
import type { LatLng, RepDaySnapshot, RepLiveStatus } from "../types";
import { TrackingMap, type MapPin, type MapRoute } from "./tracking-map";
import {
  TkAvatar,
  TkCard,
  TkFrame,
  TkHex,
  TkList,
  TkMapArea,
  TkPillButton,
  TkRow,
  TkSearch,
  TkSelect,
  TkSidebar,
  avatarLetter,
  avatarTone,
  compactNumber,
  tkCardButton,
} from "./tracker-ui";

/** Reps in the field first, then the ones done for the day, then the rest. */
const STATUS_ORDER: Record<RepLiveStatus, number> = {
  at_customer: 0,
  moving: 1,
  finished: 2,
  not_started: 3,
  offline: 4,
};

type ShowFilter = "all" | "field" | "finished" | "idle";
type SortKey = "status" | "sales" | "visits";

const SHOW_OPTIONS: { value: ShowFilter; label: string }[] = [
  { value: "all", label: "كل المناديب" },
  { value: "field", label: "بالميدان" },
  { value: "finished", label: "أنهوا يومهم" },
  { value: "idle", label: "لم يبدأوا" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "status", label: "الحالة" },
  { value: "sales", label: "الأعلى مبيعاً" },
  { value: "visits", label: "الأكثر زيارات" },
];

interface RepRow {
  id: string;
  name: string;
  day: RepDaySnapshot;
}

const inField = (s: RepLiveStatus) => s === "moving" || s === "at_customer";

function useRepsLive() {
  const now = useNow(30_000);
  const center = useTrackingCenter();
  const { data, isLoading } = useRepsQuery();
  const date = toDateKey(new Date(now));
  const reps = data?.data?.reps;

  const rows: RepRow[] = useMemo(
    () =>
      (reps ?? [])
        .map((rep) => ({
          id: String(rep.id),
          name: rep.name,
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
      if (inField(r.day.status)) acc.field++;
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

function midPoint(path: RepDaySnapshot["path"]): LatLng | null {
  const p = path[Math.floor(path.length / 2)];
  return p ? [p.lat, p.lng] : null;
}

function LiveDot() {
  return (
    <span className="relative flex size-2.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
      <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
    </span>
  );
}

function repSubline(row: RepRow, now: number) {
  const { day } = row;
  if (day.status === "at_customer" && day.currentCustomer) return `عند ${day.currentCustomer}`;
  const lastWork = [...day.activities].reverse().find((a) => a.type !== "day_end" || day.status === "finished");
  if (lastWork)
    return `${ACTIVITY_META[lastWork.type].label}${lastWork.customerName ? ` · ${lastWork.customerName}` : ""} · ${formatAgo(lastWork.time, now)}`;
  return day.status === "offline" ? "الحساب غير مفعّل" : "لا يوجد نشاط اليوم";
}

/** Full-page "all reps right now" view: dark list on the start side, big map beside it. */
export function RepsLiveView() {
  const { rows, now, center, date, isLoading } = useRepsLive();
  const currency = useCompanyCurrency();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<ShowFilter>("all");
  const [sort, setSort] = useState<SortKey>("status");
  const [fitRound, setFitRound] = useState(0);
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number; soft?: boolean } | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const visibleRows = useMemo(() => {
    const q = search.trim();
    const list = rows
      .filter((r) => !q || r.name.includes(q))
      .filter((r) =>
        show === "all"
          ? true
          : show === "field"
            ? inField(r.day.status)
            : show === "finished"
              ? r.day.status === "finished"
              : r.day.status === "not_started" || r.day.status === "offline",
      );
    if (sort === "sales") return [...list].sort((a, b) => b.day.stats.salesTotal - a.day.stats.salesTotal);
    if (sort === "visits") return [...list].sort((a, b) => b.day.stats.visits - a.day.stats.visits);
    return list;
  }, [rows, search, show, sort]);

  const onMap = visibleRows.filter((r) => r.day.position);
  const active = rows.find((r) => r.id === activeId) ?? null;

  const pins: MapPin[] = useMemo(
    () =>
      onMap.map((r) => {
        const tone = avatarTone(r.name);
        return {
          id: r.id,
          lat: r.day.position!.lat,
          lng: r.day.position!.lng,
          letter: avatarLetter(r.name),
          bg: tone.bg,
          fg: tone.fg,
          badgeIcon: PIN_ICONS.check,
          badgeText: `${r.day.stats.visits}/${r.day.stats.planned}`,
          live: inField(r.day.status),
          dimmed: activeId != null && r.id !== activeId,
        };
      }),
    [onMap, activeId],
  );

  const routes: MapRoute[] = useMemo(() => {
    const list: MapRoute[] = onMap.map((r) => ({
      id: `trail-${r.id}`,
      variant: "trail",
      points: r.day.path.map((p) => [p.lat, p.lng] as LatLng),
    }));
    if (active && active.day.path.length > 1)
      list.push({ id: `${date}|${active.id}`, variant: "glow", points: active.day.path.map((p) => [p.lat, p.lng] as LatLng) });
    return list;
  }, [onMap, active, date]);

  const counts = summarize(rows);

  const toggleRep = (row: RepRow, scroll = false) => {
    const next = activeId === row.id ? null : row.id;
    setActiveId(next);
    const pos = row.day.position;
    if (next && pos && !scroll) setFocus((f) => ({ lat: pos.lat, lng: pos.lng, key: (f?.key ?? 0) + 1, soft: true }));
    if (next && scroll)
      listRef.current?.querySelector(`[data-row="${row.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const card =
    active && active.day.position
      ? {
          lat: active.day.position.lat,
          lng: active.day.position.lng,
          // The whole day's route is lit up; keep the card off its middle.
          from: midPoint(active.day.path),
          content: <RepCard row={active} now={now} currency={currency} />,
        }
      : null;

  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col lg:h-svh">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-6">
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

      <div className="min-h-0 flex-1 px-3 pb-3 sm:px-4 sm:pb-4">
        <TkFrame className="h-full grid-rows-[minmax(300px,55%)_1fr] lg:grid-rows-1">
          <TkSidebar>
            <div className="space-y-4 px-5 pt-5 pb-4">
              <TkSearch value={search} onChange={setSearch} placeholder="ابحث عن مندوب..." />
              <div className="flex items-end gap-2">
                <TkSelect label="عرض:" value={show} options={SHOW_OPTIONS} onChange={setShow} />
                <TkSelect label="ترتيب:" value={sort} options={SORT_OPTIONS} onChange={setSort} />
                <TkPillButton
                  label="عرض كل المناديب على الخريطة"
                  onClick={() => {
                    setActiveId(null);
                    setFitRound((n) => n + 1);
                  }}
                >
                  <Maximize2 className="size-3.5" />
                  الكل
                </TkPillButton>
              </div>
            </div>

            <TkList listRef={listRef}>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="size-11 rounded-full bg-[var(--tk-hover-strong)]" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-28 bg-[var(--tk-hover-strong)]" />
                        <Skeleton className="h-2.5 w-40 bg-[var(--tk-hover-strong)]" />
                      </div>
                    </li>
                  ))
                : visibleRows.length === 0
                  ? <li className="py-12 text-center text-sm text-[var(--tk-muted)]">{rows.length ? "لا يوجد مناديب بهالفلتر" : "لا يوجد مناديب بعد"}</li>
                  : visibleRows.map((row, i) => (
                      <TkRow
                        key={row.id}
                        dataId={row.id}
                        index={i}
                        selected={row.id === activeId}
                        muted={!row.day.position}
                        onClick={() => toggleRep(row)}
                      >
                        <RepRowBody row={row} now={now} />
                      </TkRow>
                    ))}
            </TkList>
          </TkSidebar>

          <TkMapArea>
            <TrackingMap
              className="absolute inset-0"
              center={center}
              pins={pins}
              routes={routes}
              selectedPinId={activeId}
              onPinClick={(id) => {
                const row = rows.find((r) => r.id === id);
                if (row) toggleRep(row, true);
              }}
              onMapClick={() => setActiveId(null)}
              card={card}
              fitKey={`all|${date}|${rows.length}|${fitRound}`}
              focus={focus}
            />
          </TkMapArea>
        </TkFrame>
      </div>
    </div>
  );
}

function RepRowBody({ row, now }: { row: RepRow; now: number }) {
  const { day } = row;
  const status = STATUS_META[day.status];
  const live = inField(day.status);
  return (
    <>
      <span className="relative">
        <TkAvatar name={row.name} className={cn(!day.position && "grayscale")} />
        {live && <span className="absolute -bottom-0.5 -left-0.5 size-3 rounded-full border-2 border-[var(--tk-bg)] bg-[var(--tk-accent)]" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px]">{row.name}</div>
        <div className="truncate text-[11.5px] text-[var(--tk-muted)]">
          <span style={{ color: live ? "var(--tk-accent)" : undefined }}>{status.label}</span>
          {" • "}
          {repSubline(row, now)}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <TkHex title="زيارات اليوم">{day.stats.visits}</TkHex>
        <Link
          href={`/reps/detail?id=${row.id}&tab=tracking`}
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-accent)]"
          aria-label={`تتبع ${row.name}`}
          title="فتح تتبع المندوب"
        >
          <IconRenderer name="external_outlined" className="size-3.5" />
        </Link>
      </div>
    </>
  );
}

function RepCard({ row, now, currency }: { row: RepRow; now: number; currency: string }) {
  const { day } = row;
  const status = STATUS_META[day.status];
  const recent = day.activities.filter((a) => a.type !== "day_start").slice(-3).reverse();
  const title =
    day.status === "at_customer" && day.currentCustomer
      ? `هلّق عند ${day.currentCustomer}`
      : day.status === "moving"
        ? `بالطريق للزيارة رقم ${day.stats.visits + 1}`
        : day.status === "finished"
          ? "خلّص يومه ورجع عالمستودع"
          : status.label;
  return (
    <TkCard
      name={row.name}
      sub={
        <>
          {day.stats.lastActivity ? `آخر نشاط ${formatAgo(day.stats.lastActivity, now)}` : "—"} •{" "}
          <span style={{ color: inField(day.status) ? "var(--tk-accent)" : undefined }}>{status.label}</span>
        </>
      }
      stats={[
        { icon: <CircleCheck />, text: `${day.stats.visits}/${day.stats.planned}` },
        { icon: <Receipt />, text: day.stats.salesTotal ? compactNumber(day.stats.salesTotal) : "—" },
        { icon: <Route />, text: `${day.stats.distanceKm} كم` },
      ]}
      title={title}
      lines={recent.map((a) => (
        <>
          <span className="tabular-nums">{formatTime(a.time)}</span> · {ACTIVITY_META[a.type].label}
          {a.customerName ? ` · ${a.customerName}` : ""}
          {a.amount ? ` ${formatMoney(a.amount, currency)}` : ""}
        </>
      ))}
      action={
        <Link href={`/reps/detail?id=${row.id}&tab=tracking`} className={tkCardButton}>
          فتح تتبع المندوب
        </Link>
      }
    />
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
