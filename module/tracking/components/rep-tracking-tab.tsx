"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Navigation, Pause, Play, Receipt, Route } from "lucide-react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { buildRepDay } from "../lib/dummy-day";
import {
  ACTIVITY_META,
  STATUS_META,
  distanceKm,
  formatAgo,
  formatDayLabel,
  formatDuration,
  formatTime,
  pathDistanceKm,
  shiftDateKey,
  toDateKey,
} from "../lib/geo";
import { ACTIVITY_PIN_ICON, ACTIVITY_TONE, PIN_ICONS } from "../lib/pin-icons";
import { useCompanyCurrency, useNow, useTrackingCenter } from "../hooks";
import type { LatLng, PlannedCustomer, RepActivity, RepActivityType, TrackPoint } from "../types";
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

const REPLAY_STEP_MS = 2 * 60_000;

/** The visit takes the look of the "most telling" thing that happened there. */
const STOP_PRIORITY: RepActivityType[] = ["no_sale", "return", "invoice", "collection", "new_customer"];

type ShowFilter = "all" | "visited" | "pending" | "invoice" | "collection" | "return" | "no_sale";
type SortKey = "route" | "sales" | "distance";

const SHOW_OPTIONS: { value: ShowFilter; label: string }[] = [
  { value: "all", label: "كل المحلات" },
  { value: "visited", label: "تمت زيارتها" },
  { value: "pending", label: "بانتظار الزيارة" },
  { value: "invoice", label: "فيها فواتير" },
  { value: "collection", label: "فيها تحصيل" },
  { value: "return", label: "فيها مرتجع" },
  { value: "no_sale", label: "بدون بيع" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "route", label: "ترتيب الزيارة" },
  { value: "sales", label: "الأعلى مبيعاً" },
  { value: "distance", label: "الأقرب" },
];

interface Visit {
  id: string;
  index: number;
  name: string;
  lat: number;
  lng: number;
  items: RepActivity[];
  main: RepActivity;
  arrivedAt: number;
  /** The road driven from the previous stop to this shop. */
  leg: LatLng[];
  legKm: number;
  sales: number;
  collected: number;
  returned: number;
}

const samePoint = (p: TrackPoint, lat: number, lng: number) => p.lat === lat && p.lng === lng;

/** Group the day's activities into shop visits and cut the GPS path into the leg leading to each. */
function buildVisits(activities: RepActivity[], path: TrackPoint[]): Visit[] {
  const byVisit = new Map<number, RepActivity[]>();
  activities.forEach((a) => {
    if (a.visitIndex == null) return;
    byVisit.set(a.visitIndex, [...(byVisit.get(a.visitIndex) ?? []), a]);
  });

  let cursor = 0;
  return [...byVisit.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, items]) => {
      const main = STOP_PRIORITY.map((type) => items.find((a) => a.type === type)).find(Boolean) ?? items[0];
      const { lat, lng } = items[0];
      // Legs end exactly on the shop's coordinates; the next one starts after the stay.
      let end = path.findIndex((p, i) => i >= cursor && samePoint(p, lat, lng));
      if (end === -1) end = path.length - 1;
      const legPoints = path.slice(cursor, end + 1);
      cursor = end;
      while (cursor + 1 < path.length && samePoint(path[cursor + 1], lat, lng)) cursor++;
      const sum = (type: RepActivityType) =>
        items.filter((a) => a.type === type).reduce((s, a) => s + (a.amount ?? 0), 0);
      return {
        id: `visit-${index}`,
        index,
        name: items.find((a) => a.type !== "new_customer")?.customerName ?? items[0].customerName ?? "",
        lat,
        lng,
        items,
        main,
        arrivedAt: items[0].time,
        leg: legPoints.map((p) => [p.lat, p.lng] as LatLng),
        legKm: pathDistanceKm(legPoints),
        sales: sum("invoice"),
        collected: sum("collection"),
        returned: sum("return"),
      };
    });
}

function visitAmount(v: Visit) {
  return v.sales || v.collected || v.returned;
}

export function RepTrackingTab({ repId, isActive = true }: { repId: string; isActive?: boolean }) {
  const now = useNow(30_000);
  const center = useTrackingCenter();
  const currency = useCompanyCurrency();
  const today = toDateKey(new Date(now));
  const [date, setDate] = useState(today);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayAt, setReplayAt] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<ShowFilter>("all");
  const [sort, setSort] = useState<SortKey>("route");
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number; soft?: boolean } | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

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
    setReplayOpen(false);
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

  const visits = useMemo(() => buildVisits(day.activities, day.path), [day.activities, day.path]);
  const depot = live.activities[0]?.type === "day_start" ? ([live.activities[0].lat, live.activities[0].lng] as LatLng) : null;

  const rows = useMemo(() => {
    const q = search.trim();
    const typeFilter = ["invoice", "collection", "return", "no_sale"].includes(show) ? (show as RepActivityType) : null;
    const visited = visits
      .filter((v) => !q || v.name.includes(q))
      .filter((v) => show === "all" || show === "visited" || (typeFilter && v.items.some((a) => a.type === typeFilter)));
    if (sort === "sales") visited.sort((a, b) => visitAmount(b) - visitAmount(a));
    if (sort === "distance") visited.sort((a, b) => a.legKm - b.legKm);
    const pending =
      show === "all" || show === "pending"
        ? day.unvisited.filter((c) => !q || c.name.includes(q))
        : [];
    return { visited: show === "pending" ? [] : visited, pending };
  }, [visits, day.unvisited, search, show, sort]);

  const selectedVisit = visits.find((v) => v.id === selectedId) ?? null;
  const selectedPlanned = selectedVisit ? null : day.unvisited.find((c) => `planned-${c.id}` === selectedId) ?? null;

  const pins: MapPin[] = useMemo(() => {
    const visitPins = visits.map((v) => {
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
        badgeText: amount ? compactNumber(amount) : "—",
        badgeColor: ACTIVITY_TONE[v.main.type],
      };
    });
    const plannedPins = day.unvisited.map((c) => ({
      id: `planned-${c.id}`,
      lat: c.lat,
      lng: c.lng,
      letter: avatarLetter(c.name),
      bg: "var(--tk-planned-bg)",
      fg: "var(--tk-planned-fg)",
      badgeIcon: PIN_ICONS.clock,
      dimmed: true,
    }));
    return [...plannedPins, ...visitPins];
  }, [visits, day.unvisited]);

  const routes: MapRoute[] = useMemo(() => {
    const list: MapRoute[] = [{ id: "trail", variant: "trail", points: day.path.map((p) => [p.lat, p.lng] as LatLng) }];
    if (selectedVisit) list.push({ id: `${date}|${selectedVisit.id}`, variant: "glow", points: selectedVisit.leg });
    return list;
  }, [day.path, selectedVisit, date]);

  const position =
    day.position && day.status !== "finished"
      ? {
          lat: day.position.lat,
          lng: day.position.lng,
          live: isToday && replayAt == null && (day.status === "moving" || day.status === "at_customer"),
        }
      : null;

  const select = (id: string | null, scroll = false) => {
    setSelectedId((cur) => (cur === id ? null : id));
    if (id && scroll) {
      listRef.current?.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const selectFromList = (id: string, lat: number, lng: number) => {
    const wasSelected = selectedId === id;
    select(id);
    if (!wasSelected) setFocus((f) => ({ lat, lng, key: (f?.key ?? 0) + 1, soft: true }));
  };

  const status = STATUS_META[isFuture ? "not_started" : day.status];
  const { stats } = day;
  const workSpan = stats.firstActivity && stats.lastActivity ? stats.lastActivity - stats.firstActivity : 0;

  const card = selectedVisit
    ? { lat: selectedVisit.lat, lng: selectedVisit.lng, from: selectedVisit.leg[0] ?? null, content: (
          <VisitCard
            visit={selectedVisit}
            cameFrom={visits.find((v) => v.index === selectedVisit.index - 1)?.name ?? "المستودع"}
            currency={currency}
            repId={repId}
          />
        ),
      }
    : selectedPlanned
      ? { lat: selectedPlanned.lat, lng: selectedPlanned.lng, content: <PlannedCard customer={selectedPlanned} depot={depot} finished={day.status === "finished"} /> }
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Day stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile icon="location_outlined" label="الزيارات" value={`${stats.visits}/${stats.planned}`} sub="من الزبائن المخطط لهم" progress={stats.planned ? stats.visits / stats.planned : 0} />
        <StatTile icon="revenue_outlined" label="المبيعات" value={formatMoney(stats.salesTotal, currency)} sub={`${stats.invoicesCount} فاتورة`} />
        <StatTile icon="money_outlined" label="التحصيل" value={formatMoney(stats.collectionsTotal, currency)} sub={stats.returnsTotal ? `مرتجع ${formatMoney(stats.returnsTotal, currency)}` : "بدون مرتجعات"} />
        <StatTile icon="map_outlined" label="المسافة المقطوعة" value={`${stats.distanceKm} كم`} sub="حسب مسار GPS" />
        <StatTile icon="clock_outlined" label="ساعات العمل" value={workSpan ? formatDuration(workSpan) : "—"} sub={stats.firstActivity ? `من ${formatTime(stats.firstActivity)}` : "لم يبدأ"} />
        <StatTile icon="time_outlined" label="آخر نشاط" value={stats.lastActivity ? formatTime(stats.lastActivity) : "—"} sub={day.activities.length ? ACTIVITY_META[day.activities[day.activities.length - 1].type].label : "لا يوجد"} />
      </div>

      <TkFrame className="lg:h-[700px]">
        <TkSidebar className="max-h-[560px] lg:max-h-none">
          {/* Day switcher, laid out like an app header */}
          <div className="flex items-center justify-between gap-2 px-5 pt-5">
            <button
              type="button"
              onClick={() => goToDate(shiftDateKey(date, -1))}
              className="grid size-8 place-items-center rounded-lg text-[var(--tk-soft)] transition-colors hover:bg-[var(--tk-hover-strong)]"
              aria-label="اليوم السابق"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--tk-accent)] text-white">
                <Navigation className="size-[18px] fill-current" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{formatDayLabel(date)}</div>
                {isToday ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--tk-muted)]">
                    <span className={cn("size-1.5 rounded-full", status.dot, day.status !== "finished" && day.status !== "offline" && "animate-pulse")} />
                    {status.label}
                    {stats.lastActivity && replayAt == null ? ` · ${formatAgo(stats.lastActivity, now)}` : ""}
                  </div>
                ) : (
                  <button type="button" onClick={() => goToDate(today)} className="text-[11px] text-[var(--tk-accent)] hover:underline">
                    رجوع لليوم
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => goToDate(shiftDateKey(date, 1))}
              disabled={isToday}
              className="grid size-8 place-items-center rounded-lg text-[var(--tk-soft)] transition-colors hover:bg-[var(--tk-hover-strong)] disabled:opacity-25 disabled:hover:bg-transparent"
              aria-label="اليوم التالي"
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>

          <div className="space-y-4 px-5 pt-5 pb-4">
            <TkSearch value={search} onChange={setSearch} placeholder="ابحث عن محل..." />
            <div className="flex items-end gap-2">
              <TkSelect label="عرض:" value={show} options={SHOW_OPTIONS} onChange={setShow} />
              <TkSelect label="ترتيب:" value={sort} options={SORT_OPTIONS} onChange={setSort} />
              <TkPillButton
                label="إعادة عرض اليوم"
                active={replayOpen}
                onClick={() => {
                  if (!canReplay) return;
                  if (replayOpen) {
                    setReplayOpen(false);
                    setPlaying(false);
                    setReplayAt(null);
                  } else {
                    setReplayOpen(true);
                    setSelectedId(null);
                    setReplayAt(sliderMin);
                    setPlaying(true);
                  }
                }}
              >
                <Play className="size-3.5" />
                إعادة
              </TkPillButton>
            </div>
          </div>

          <TkList listRef={listRef}>
            {rows.visited.length === 0 && rows.pending.length === 0 && (
              <li className="py-12 text-center text-sm text-[var(--tk-muted)]">
                {isFuture || day.status === "not_started"
                  ? "لم يبدأ المندوب يومه بعد"
                  : day.status === "offline"
                    ? "حساب المندوب غير مفعّل"
                    : "لا يوجد محلات بهالفلتر"}
              </li>
            )}
            {rows.visited.map((v, i) => (
              <TkRow key={v.id} dataId={v.id} index={i} selected={v.id === selectedId} onClick={() => selectFromList(v.id, v.lat, v.lng)}>
                <VisitRowBody visit={v} />
              </TkRow>
            ))}
            {rows.pending.map((c, i) => (
              <TkRow
                key={c.id}
                dataId={`planned-${c.id}`}
                index={rows.visited.length + i}
                muted
                selected={`planned-${c.id}` === selectedId}
                onClick={() => selectFromList(`planned-${c.id}`, c.lat, c.lng)}
              >
                <TkAvatar name={c.name} className="grayscale" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px]">{c.name}</div>
                  <div className="truncate text-[11.5px] text-[var(--tk-muted)]">
                    {depot ? `${distanceKm(depot, [c.lat, c.lng]).toFixed(1)} كم من المستودع • ` : ""}
                    {day.status === "finished" ? "لم تتم زيارته" : "بانتظار الزيارة"}
                  </div>
                </div>
                <TkHex title="لم تتم زيارته">—</TkHex>
              </TkRow>
            ))}
          </TkList>
        </TkSidebar>

        <TkMapArea className="h-[460px] lg:h-auto">
          <TrackingMap
            className="absolute inset-0"
            center={center}
            pins={pins}
            routes={routes}
            position={position}
            depot={depot}
            selectedPinId={selectedId}
            onPinClick={(id) => select(id, true)}
            onMapClick={() => setSelectedId(null)}
            card={card}
            fitKey={`${repId}|${date}`}
            focus={focus}
          >
            {/* Live status, floating at the top of the map */}
            <div className="pointer-events-none absolute top-4 right-4 z-[1000] flex items-center gap-2" dir="rtl">
              <span className="flex items-center gap-2 rounded-full border border-[var(--tk-line)] bg-[var(--tk-surface)] px-3 py-1.5 text-xs text-[var(--tk-fg)] shadow-lg backdrop-blur">
                <span className={cn("size-2 rounded-full", status.dot, isToday && position?.live && "animate-pulse")} />
                {status.label}
                {day.status === "at_customer" && day.currentCustomer ? ` · ${day.currentCustomer}` : ""}
              </span>
              {stats.distanceKm > 0 && (
                <span className="rounded-full border border-[var(--tk-line)] bg-[var(--tk-surface)] px-3 py-1.5 text-xs text-[var(--tk-soft)] tabular-nums shadow-lg backdrop-blur">
                  {stats.distanceKm} كم اليوم
                </span>
              )}
            </div>

            {replayOpen && canReplay && (
              <div
                dir="rtl"
                className="absolute inset-x-4 bottom-4 z-[1000] flex items-center gap-3 rounded-2xl border border-[var(--tk-line)] bg-[var(--tk-surface)] px-3 py-2.5 text-[var(--tk-fg)] shadow-2xl backdrop-blur"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!playing && replayAt == null) setReplayAt(sliderMin);
                    setPlaying((p) => !p);
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--tk-accent)] text-white"
                  aria-label={playing ? "إيقاف" : "تشغيل"}
                >
                  {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                </button>
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
                  className="tk-range h-1.5 flex-1 cursor-pointer"
                  aria-label="إعادة عرض اليوم"
                />
                <span className="w-16 shrink-0 text-center text-xs font-semibold tabular-nums">
                  {formatTime(Math.min(viewAt, sliderMax))}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setReplayAt(null);
                    setReplayOpen(false);
                  }}
                  className="h-8 shrink-0 rounded-lg border border-[var(--tk-line)] px-3 text-xs hover:border-[var(--tk-line-strong)]"
                >
                  {isToday ? "مباشر" : "كامل اليوم"}
                </button>
              </div>
            )}
          </TrackingMap>
        </TkMapArea>
      </TkFrame>
    </div>
  );
}

/** Short row labels — the full ones don't fit next to an amount. */
const SHORT_LABEL: Record<RepActivityType, string> = {
  day_start: "بداية الدوام",
  invoice: "فاتورة",
  collection: "تحصيل",
  return: "مرتجع",
  new_customer: "زبون جديد",
  no_sale: "بدون بيع",
  day_end: "نهاية الدوام",
};

function VisitRowBody({ visit }: { visit: Visit }) {
  const amount = visitAmount(visit);
  return (
    <>
      <TkAvatar name={visit.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px]">{visit.name}</div>
        <div className="truncate text-[11.5px] text-[var(--tk-muted)]">
          <span className="tabular-nums">{formatTime(visit.arrivedAt)}</span>
          {" • "}
          <span style={{ color: ACTIVITY_TONE[visit.main.type] ?? "var(--tk-accent)" }}>
            {SHORT_LABEL[visit.main.type]}
            {amount ? ` ${amount.toLocaleString("en")}` : ""}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <TkHex title={`الزيارة رقم ${visit.index}`}>{visit.index}</TkHex>
        <span className="text-[10px] text-[var(--tk-muted)] tabular-nums">{visit.legKm} كم</span>
      </div>
    </>
  );
}

function VisitCard({
  visit,
  cameFrom,
  currency,
  repId,
}: {
  visit: Visit;
  cameFrom: string;
  currency: string;
  repId: string;
}) {
  const meta = ACTIVITY_META[visit.main.type];
  const amount = visitAmount(visit);
  const last = visit.items[visit.items.length - 1];
  return (
    <TkCard
      name={visit.name}
      sub={
        <>
          الزيارة {visit.index} •{" "}
          <span style={{ color: ACTIVITY_TONE[visit.main.type] ?? "var(--tk-accent)" }}>وصل {formatTime(visit.arrivedAt)}</span>
        </>
      }
      stats={[
        { icon: <Receipt />, text: amount ? compactNumber(amount) : "—", tone: ACTIVITY_TONE[visit.main.type] },
        { icon: <Clock />, text: formatDuration(Math.max(last.time - visit.arrivedAt, 0) + 2 * 60_000) },
        { icon: <Route />, text: `${visit.legKm} كم` },
      ]}
      title={amount ? `${meta.label} بقيمة ${formatMoney(amount, currency)}` : meta.label}
      lines={[
        `جاي من ${cameFrom} — ${visit.legKm} كم`,
        // One activity is already the title; list them only when there's more than one.
        ...(visit.items.length > 1
          ? visit.items.map((a) => (
              <>
                <span className="tabular-nums">{formatTime(a.time)}</span> · {ACTIVITY_META[a.type].label}
                {a.amount ? ` ${formatMoney(a.amount, currency)}` : ""}
              </>
            ))
          : []),
        ...visit.items.filter((a) => a.note).map((a) => a.note!),
      ]}
      action={
        <Link href={`/reps/detail?id=${repId}&tab=invoices`} className={tkCardButton}>
          فواتير المندوب
        </Link>
      }
    />
  );
}

function PlannedCard({ customer, depot, finished }: { customer: PlannedCustomer; depot: LatLng | null; finished: boolean }) {
  return (
    <TkCard
      name={customer.name}
      sub={finished ? "لم تتم زيارته بهاليوم" : "بانتظار الزيارة"}
      stats={[
        { icon: <Clock />, text: finished ? "فاتت" : "لاحقاً", tone: finished ? "var(--tk-red)" : undefined },
        { icon: <Route />, text: depot ? `${distanceKm(depot, [customer.lat, customer.lng]).toFixed(1)} كم` : "—" },
      ]}
      title={finished ? "ما انزار اليوم" : "ضمن خط سير اليوم"}
      lines={[finished ? "كان مخطط يزوره المندوب حسب أيام عمله" : "رح يبيّن هون أول ما يوصله المندوب"]}
    />
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
