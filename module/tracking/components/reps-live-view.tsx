"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Ban, CircleCheck, Flag, Receipt, Route, Undo2, UserPlus, Wallet } from "lucide-react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { ACTIVITY_META, STATUS_META, formatAgo, formatTime, syriaDateKey } from "../lib/geo";
import { ACTIVITY_PIN_ICON, ACTIVITY_TONE, PIN_ICONS } from "../lib/pin-icons";
import { SHORT_LABEL, buildVisits, visitAmount } from "../lib/visits";
import { useCompanyCurrency, useNow, useRepDayQuery, useRepsLiveQuery, useTrackingCenter } from "../hooks";
import type { LatLng, RepActivityType, RepDaySnapshot, RepLiveStatus } from "../types";
import { TrackingMap, type MapPin, type MapRoute } from "./tracking-map";
import {
  TkAvatar,
  TkCollapseButton,
  TkDetail,
  TkFrame,
  TkHex,
  TkList,
  TkMapArea,
  TkPillButton,
  TkRow,
  TkSearch,
  TkSelect,
  TkSidebar,
  TkTimeline,
  avatarLetter,
  avatarTone,
  compactNumber,
  tkButton,
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

const ACTIVITY_ICON: Record<RepActivityType, ReactNode> = {
  day_start: <Flag />,
  invoice: <Receipt />,
  collection: <Wallet />,
  return: <Undo2 />,
  new_customer: <UserPlus />,
  no_sale: <Ban />,
  day_end: <Flag />,
};

const toneOf = (type: RepActivityType) => ACTIVITY_TONE[type] ?? "var(--tk-accent)";
const toLatLngs = (path: RepDaySnapshot["path"]) => path.map((p) => [p.lat, p.lng] as LatLng);

interface RepRow {
  id: string;
  name: string;
  day: RepDaySnapshot;
}

const inField = (s: RepLiveStatus) => s === "moving" || s === "at_customer";

function useRepsLive() {
  const now = useNow(30_000);
  const center = useTrackingCenter();
  const date = syriaDateKey(now);
  const { rows: liveRows, isLoading } = useRepsLiveQuery();
  // The server lists active reps first, then by name; keep that order within each status.
  const rows: RepRow[] = useMemo(
    () => [...liveRows].sort((a, b) => STATUS_ORDER[a.day.status] - STATUS_ORDER[b.day.status]),
    [liveRows],
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
  if (day.status === "at_customer" && day.currentCustomer) return `لدى ${day.currentCustomer}`;
  const lastWork = [...day.activities].reverse().find((a) => a.type !== "day_end" || day.status === "finished");
  if (lastWork)
    return `${ACTIVITY_META[lastWork.type].label}${lastWork.customerName ? ` · ${lastWork.customerName}` : ""} · ${formatAgo(lastWork.time, now)}`;
  return day.status === "offline" ? "الحساب غير مفعّل" : "لا يوجد نشاط اليوم";
}

/** Full-page "all reps right now" view: list (or one rep's day) on the start side, big map beside it. */
export function RepsLiveView() {
  const { rows, now, center, date, isLoading } = useRepsLive();
  const currency = useCompanyCurrency();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<ShowFilter>("all");
  const [sort, setSort] = useState<SortKey>("status");
  const [expanded, setExpanded] = useState(false);
  const [fitRound, setFitRound] = useState(0);
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

  const activeRow = rows.find((r) => r.id === activeId) ?? null;
  // The list only carries a thinned path; an opened rep gets their whole day (and is followed point by point).
  const { day: activeDay, isLoading: activeLoading } = useRepDayQuery(activeId, date, date);
  const active = useMemo(
    () => (activeRow ? { ...activeRow, day: activeLoading ? activeRow.day : activeDay } : null),
    [activeRow, activeDay, activeLoading],
  );
  const activeVisits = useMemo(
    () => (active ? buildVisits(active.day.activities, active.day.path) : []),
    [active],
  );
  const activeVisit = activeVisits.find((v) => v.id === visitId) ?? null;

  const pins: MapPin[] = useMemo(() => {
    // One rep open: their shops only, so the map is about them.
    if (active) {
      return activeVisits.map((v) => {
        const tone = avatarTone(v.name);
        const amount = visitAmount(v);
        return {
          id: v.id,
          lat: v.lat,
          lng: v.lng,
          letter: avatarLetter(v.name),
          bg: tone.bg,
          fg: tone.fg,
          badgeIcon: ACTIVITY_PIN_ICON[v.main.type],
          badgeText: amount ? compactNumber(amount) : SHORT_LABEL[v.main.type],
          badgeColor: ACTIVITY_TONE[v.main.type],
          dimmed: visitId != null && visitId !== v.id,
        };
      });
    }
    return visibleRows
      .filter((r) => r.day.position)
      .map((r) => {
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
        };
      });
  }, [active, activeVisits, visitId, visibleRows]);

  const routes: MapRoute[] = useMemo(() => {
    if (active) {
      const path = toLatLngs(active.day.path);
      return activeVisit
        ? [
            { id: `trail-${active.id}`, variant: "trail" as const, points: path },
            { id: `${date}|${active.id}|${activeVisit.id}`, variant: "route" as const, points: activeVisit.leg },
          ]
        : [{ id: `${date}|${active.id}`, variant: "route" as const, points: path }];
    }
    return visibleRows
      .filter((r) => r.day.position)
      .map((r) => ({ id: `trail-${r.id}`, variant: "trail" as const, points: toLatLngs(r.day.path) }));
  }, [active, activeVisit, visibleRows, date]);

  const view = activeVisit
    ? { key: `v|${active!.id}|${activeVisit.id}`, points: activeVisit.leg.length > 1 ? activeVisit.leg : [[activeVisit.lat, activeVisit.lng] as LatLng] }
    : active
      ? { key: `r|${active.id}`, points: active.day.path.length ? toLatLngs(active.day.path) : [] }
      : { key: `all|${fitRound}`, points: rows.flatMap((r) => toLatLngs(r.day.path)) };

  const counts = summarize(rows);

  const openRep = (id: string) => {
    setActiveId(id);
    setVisitId(null);
  };

  const closeRep = () => {
    const id = activeId;
    setActiveId(null);
    setVisitId(null);
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ block: "nearest" }));
  };

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
        <TkFrame expanded={expanded} className="h-full grid-rows-[minmax(300px,55%)_1fr] lg:grid-rows-1">
          <TkSidebar hidden={expanded}>
            {active ? (
              <RepDetail
                row={active}
                visits={activeVisits}
                visitId={visitId}
                onVisit={(id) => setVisitId((cur) => (cur === id ? null : id))}
                now={now}
                currency={currency}
                onBack={closeRep}
                onCollapse={() => setExpanded(true)}
              />
            ) : (
              <>
                <div className="space-y-4 px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <TkSearch value={search} onChange={setSearch} placeholder="ابحث عن مندوب..." />
                    </div>
                    <TkCollapseButton onClick={() => setExpanded(true)} />
                  </div>
                  <div className="flex items-end gap-2">
                    <TkSelect label="عرض:" value={show} options={SHOW_OPTIONS} onChange={setShow} />
                    <TkSelect label="ترتيب:" value={sort} options={SORT_OPTIONS} onChange={setSort} />
                    <TkPillButton label="عرض كل المناديب على الخريطة" onClick={() => setFitRound((n) => n + 1)}>
                      <IconRenderer name="map_outlined" className="size-3.5" />
                      الكل
                    </TkPillButton>
                  </div>
                </div>

                <TkList listRef={listRef}>
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                          <Skeleton className="size-11 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-2.5 w-40" />
                          </div>
                        </li>
                      ))
                    : visibleRows.length === 0
                      ? <li className="py-12 text-center text-sm text-muted-foreground">{rows.length ? "لا يوجد مناديب مطابقون لهذا الفلتر" : "لا يوجد مناديب بعد"}</li>
                      : visibleRows.map((row, i) => (
                          <TkRow key={row.id} dataId={row.id} index={i} muted={!row.day.position} onClick={() => openRep(row.id)}>
                            <RepRowBody row={row} now={now} />
                          </TkRow>
                        ))}
                </TkList>
              </>
            )}
          </TkSidebar>

          <TkMapArea expanded={expanded} onToggleExpand={() => setExpanded((e) => !e)}>
            <TrackingMap
              className="absolute inset-0"
              center={center}
              pins={pins}
              routes={routes}
              position={
                active?.day.position
                  ? { lat: active.day.position.lat, lng: active.day.position.lng, live: inField(active.day.status) }
                  : null
              }
              selectedPinId={active ? visitId : null}
              onPinClick={(id) => (active ? setVisitId((cur) => (cur === id ? null : id)) : openRep(id))}
              onMapClick={() => setVisitId(null)}
              fitKey={`all|${date}|${rows.length}`}
              view={view}
            >
              {active && (
                <div className={cn("pointer-events-none absolute top-4 z-[1000]", expanded ? "right-44" : "right-4")} dir="rtl">
                  <span className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs text-foreground shadow-md backdrop-blur">
                    <span className={cn("size-2 rounded-full", STATUS_META[active.day.status].dot, inField(active.day.status) && "animate-pulse")} />
                    {active.name} · {STATUS_META[active.day.status].label}
                  </span>
                </div>
              )}
            </TrackingMap>
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
        {live && <span className="absolute -bottom-0.5 -left-0.5 size-3 rounded-full border-2 border-card bg-primary" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px]">{row.name}</div>
        <div className="truncate text-[11.5px] text-muted-foreground">
          <span className={cn(live && "text-[var(--tk-accent)]")}>{status.label}</span>
          {" • "}
          {repSubline(row, now)}
        </div>
      </div>
      <TkHex title="زيارات اليوم" active={live}>
        {day.stats.visits}
      </TkHex>
    </>
  );
}

function RepDetail({
  row,
  visits,
  visitId,
  onVisit,
  now,
  currency,
  onBack,
  onCollapse,
}: {
  row: RepRow;
  visits: ReturnType<typeof buildVisits>;
  visitId: string | null;
  onVisit: (id: string) => void;
  now: number;
  currency: string;
  onBack: () => void;
  onCollapse: () => void;
}) {
  const { day } = row;
  const status = STATUS_META[day.status];
  const title =
    day.status === "at_customer" && day.currentCustomer
      ? `حالياً لدى ${day.currentCustomer}`
      : day.status === "moving"
        ? `في الطريق إلى الزيارة رقم ${day.stats.visits + 1}`
        : day.status === "finished"
          ? "أنهى يومه"
          : status.label;
  return (
    <TkDetail
      key={row.id}
      onBack={onBack}
      onCollapse={onCollapse}
      backLabel="كل المناديب"
      name={row.name}
      nameHref={`/reps/detail?id=${row.id}`}
      sub={
        <>
          <span className={cn(inField(day.status) && "text-[var(--tk-accent)]")}>{status.label}</span>
          {day.stats.lastActivity ? ` • آخر نشاط ${formatAgo(day.stats.lastActivity, now)}` : ""}
        </>
      }
      stats={[
        { icon: <CircleCheck />, label: "الزيارات", value: `${day.stats.visits}/${day.stats.planned}` },
        { icon: <Receipt />, label: "المبيعات", value: day.stats.salesTotal ? compactNumber(day.stats.salesTotal) : "—" },
        { icon: <Route />, label: "المسافة", value: `${day.stats.distanceKm} كم` },
      ]}
      title={title}
      action={
        <Link href={`/reps/detail?id=${row.id}&tab=tracking`} className={tkButton}>
          فتح تتبع المندوب الكامل
        </Link>
      }
    >
      {visits.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">لا توجد زيارات اليوم</p>
      ) : (
        <TkTimeline
          items={visits.map((v) => {
            const amount = visitAmount(v);
            return {
              key: v.id,
              icon: ACTIVITY_ICON[v.main.type],
              tone: toneOf(v.main.type),
              active: v.id === visitId,
              onClick: () => onVisit(v.id),
              title: (
                <>
                  <span className="text-muted-foreground tabular-nums">{v.index}.</span> {v.name}
                </>
              ),
              meta: (
                <>
                  <span className="tabular-nums">{formatTime(v.arrivedAt)}</span> · {SHORT_LABEL[v.main.type]}
                  {amount ? ` ${formatMoney(amount, currency)}` : ""}
                </>
              ),
            };
          })}
        />
      )}
    </TkDetail>
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
            : `${counts.field} بالميدان الآن · ${counts.visits}/${counts.planned} زيارة اليوم · موقع كل مندوب وما أنجزه`}
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
