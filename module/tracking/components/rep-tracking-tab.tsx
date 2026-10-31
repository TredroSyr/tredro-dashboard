"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LocateFixed,
  Navigation,
  Pause,
  Play,
  Receipt,
  Route,
  Undo2,
  UserPlus,
  Wallet,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { buildRepDay, dayStops } from "../lib/dummy-day";
import {
  ACTIVITY_META,
  STATUS_META,
  distanceKm,
  formatAgo,
  formatDayLabel,
  formatDuration,
  formatTime,
  shiftDateKey,
  toDateKey,
} from "../lib/geo";
import { ACTIVITY_PIN_ICON, ACTIVITY_TONE, PIN_ICONS } from "../lib/pin-icons";
import { SHORT_LABEL, buildVisits, visitAmount, type Visit } from "../lib/visits";
import { bearing, pointAt, turnToward } from "../lib/replay";
import { useCompanyCurrency, useNow, useRepCustomers, useRoadLegs, useTrackingCenter } from "../hooks";
import type { LatLng, PlannedCustomer, RepActivityType } from "../types";
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
  useFillHeight,
} from "./tracker-ui";

/** Replay pace at ×1: 4 minutes of the day per second, so a full day plays in about a minute. */
const SIM_SPEED = (4 * 60_000) / 1000;
const SPEEDS = [1, 2, 4] as const;

const ACTIVITY_ICON: Record<RepActivityType, ReactNode> = {
  day_start: <Flag />,
  invoice: <Receipt />,
  collection: <Wallet />,
  return: <Undo2 />,
  new_customer: <UserPlus />,
  no_sale: <Ban />,
  day_end: <Flag />,
};

type ShowFilter = "all" | "visited" | "pending" | "invoice" | "collection" | "return" | "no_sale";
type SortKey = "route" | "sales" | "distance";

const SHOW_OPTIONS: { value: ShowFilter; label: string }[] = [
  { value: "all", label: "كل المحلات" },
  { value: "visited", label: "تمت زيارتها" },
  { value: "pending", label: "بانتظار الزيارة" },
  { value: "invoice", label: "فيها فواتير" },
  { value: "collection", label: "فيها تحصيل" },
  { value: "return", label: "فيها مرتجع" },
  { value: "no_sale", label: "دون بيع" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "route", label: "ترتيب الزيارة" },
  { value: "sales", label: "الأعلى مبيعاً" },
  { value: "distance", label: "الأقرب" },
];

const toneOf = (type: RepActivityType) => ACTIVITY_TONE[type] ?? "var(--tk-accent)";

export function RepTrackingTab({ repId, isActive = true }: { repId: string; isActive?: boolean }) {
  const now = useNow(30_000);
  const center = useTrackingCenter();
  const currency = useCompanyCurrency();
  const today = toDateKey(new Date(now));
  const [date, setDate] = useState(today);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayAt, setReplayAt] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [simAt, setSimAt] = useState<number | null>(null);
  const [car, setCar] = useState<{ lat: number; lng: number; heading: number; tailFrom: LatLng } | null>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [follow, setFollow] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<ShowFilter>("all");
  const [sort, setSort] = useState<SortKey>("route");
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const fill = useFillHeight();

  const isToday = date === today;
  const isFuture = date > today;
  // Live edge: right now for today, the whole day for past days.
  const liveAt = isToday ? now : isFuture ? 0 : Number.MAX_SAFE_INTEGER;

  // The rep's real customers are the day's shops; once they're known, fetch real streets for the drive.
  const customers = useRepCustomers(repId);
  const stops = useMemo(
    () => (customers && isActive && !isFuture ? dayStops({ repId, date, center, customers }) : null),
    [customers, isActive, isFuture, repId, date, center],
  );
  const roads = useRoadLegs(stops);

  const live = useMemo(
    () => buildRepDay({ repId, date, center, at: liveAt, active: isActive, customers, roads }),
    [repId, date, center, liveAt, isActive, customers, roads],
  );
  const viewAt = replayAt ?? liveAt;
  const day = useMemo(
    () =>
      replayAt == null ? live : buildRepDay({ repId, date, center, at: viewAt, active: isActive, customers, roads }),
    [live, replayAt, repId, date, center, viewAt, isActive, customers, roads],
  );

  const sliderMin = live.dayStart ?? 0;
  const sliderMax = Math.min(live.dayEnd ?? 0, liveAt);
  const canReplay = live.activities.length > 0 && sliderMax > sliderMin;

  // --- Replay: a car drives the day's GPS path, frame by frame ---
  const pathRef = useRef(live.path);
  const simRef = useRef<number | null>(null);
  const headingRef = useRef(0);
  useEffect(() => {
    pathRef.current = live.path;
  }, [live.path]);

  /** Put the car at time `t`: smooth position + heading every frame, the rest of the map once a minute. */
  const seek = (t: number) => {
    simRef.current = t;
    setSimAt(t);
    // Same minute → same value → React skips the re-render of shops, list and line.
    setReplayAt(Math.floor(t / 60_000) * 60_000);
    const p = pointAt(pathRef.current, t);
    if (!p) return;
    if (p.heading != null) headingRef.current = turnToward(headingRef.current, p.heading, 0.3);
    setCar({ lat: p.at[0], lng: p.at[1], heading: headingRef.current, tailFrom: p.lastFix });
  };

  const stopReplay = () => {
    setPlaying(false);
    setReplayOpen(false);
    setReplayAt(null);
    setSimAt(null);
    setCar(null);
    simRef.current = null;
  };

  const startReplay = () => {
    setSelectedId(null);
    setReplayOpen(true);
    setFollow(true);
    const p = pointAt(pathRef.current, sliderMin + 60_000);
    headingRef.current = p?.heading ?? 0;
    seek(sliderMin);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (ts: number) => {
      const next = (simRef.current ?? sliderMin) + (ts - last) * speed * SIM_SPEED;
      last = ts;
      if (next >= sliderMax) {
        seek(sliderMax);
        setPlaying(false);
        return;
      }
      seek(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // seek only touches refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, sliderMin, sliderMax]);

  const goToDate = (next: string) => {
    setDate(next);
    stopReplay();
    setSelectedId(null);
  };

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
    const pending = show === "all" || show === "pending" ? day.unvisited.filter((c) => !q || c.name.includes(q)) : [];
    return { visited: show === "pending" ? [] : visited, pending };
  }, [visits, day.unvisited, search, show, sort]);

  const selectedVisit = visits.find((v) => v.id === selectedId) ?? null;
  const selectedPlanned = selectedVisit ? null : (day.unvisited.find((c) => `planned-${c.id}` === selectedId) ?? null);

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
        badgeText: amount ? compactNumber(amount) : SHORT_LABEL[v.main.type],
        badgeColor: ACTIVITY_TONE[v.main.type],
        dimmed: selectedId != null && selectedId !== v.id,
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
      dimmed: selectedId !== `planned-${c.id}`,
    }));
    return [...plannedPins, ...visitPins];
  }, [visits, day.unvisited, selectedId]);

  const routes = useMemo<MapRoute[]>(() => {
    const toLatLngs = (path: typeof day.path) => path.map((p) => [p.lat, p.lng] as LatLng);
    // Replay: the whole day dotted ahead, the road driven so far in solid blue behind the car.
    if (replayOpen) {
      return [
        { id: "trail", variant: "trail", points: toLatLngs(live.path) },
        { id: `replay|${date}`, variant: "route", points: toLatLngs(day.path) },
      ];
    }
    const list: MapRoute[] = [{ id: "trail", variant: "trail", points: toLatLngs(day.path) }];
    if (selectedVisit) list.push({ id: `${date}|${selectedVisit.id}`, variant: "route", points: selectedVisit.leg });
    return list;
  }, [replayOpen, live.path, day.path, selectedVisit, date]);

  // Opening a shop zooms to the road that led to it; closing goes back to the whole day.
  const view = selectedVisit
    ? { key: `v|${date}|${selectedVisit.id}`, points: selectedVisit.leg.length > 1 ? selectedVisit.leg : [[selectedVisit.lat, selectedVisit.lng] as LatLng] }
    : selectedPlanned
      ? { key: `p|${selectedPlanned.id}`, points: [[selectedPlanned.lat, selectedPlanned.lng] as LatLng] }
      : { key: `all|${date}|${repId}`, points: [...day.path.map((p) => [p.lat, p.lng] as LatLng), ...day.unvisited.map((c) => [c.lat, c.lng] as LatLng)] };

  // Live car (outside replay). Memoized so a re-render doesn't redraw the whole map.
  const livePos = day.position;
  const liveMoving = isToday && replayAt == null && (day.status === "moving" || day.status === "at_customer");
  const position = useMemo(() => {
    if (replayOpen || !livePos || day.status === "finished") return null;
    const prev = day.path[day.path.length - 2];
    return {
      lat: livePos.lat,
      lng: livePos.lng,
      live: liveMoving,
      heading: prev ? bearing([prev.lat, prev.lng], [livePos.lat, livePos.lng]) : 0,
    };
  }, [replayOpen, livePos, day.status, day.path, liveMoving]);

  const vehicle = car ? { ...car, follow } : null;

  const open = (id: string) => {
    setFollow(false);
    setSelectedId((cur) => (cur === id ? null : id));
  };

  const closeDetail = () => {
    const id = selectedId;
    setSelectedId(null);
    // Back on the list, keep the shop that was open in sight.
    requestAnimationFrame(() =>
      listRef.current?.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ block: "nearest" }),
    );
  };

  const status = STATUS_META[isFuture ? "not_started" : day.status];
  const { stats } = day;
  const visitPosition = selectedVisit ? visits.indexOf(selectedVisit) : -1;

  return (
    // Fills the screen below the tabs so the page itself never scrolls.
    <div ref={fill.ref} style={fill.height ? { height: fill.height } : undefined}>
      <TkFrame expanded={expanded} className="h-full">
        <TkSidebar hidden={expanded} className="max-h-[600px] lg:max-h-none">
          {selectedVisit ? (
            <VisitDetail
              visit={selectedVisit}
              cameFrom={visits[visitPosition - 1]?.name ?? "المستودع"}
              currency={currency}
              repId={repId}
              onBack={closeDetail}
              onCollapse={() => setExpanded(true)}
              onPrev={visitPosition > 0 ? () => setSelectedId(visits[visitPosition - 1].id) : undefined}
              onNext={visitPosition < visits.length - 1 ? () => setSelectedId(visits[visitPosition + 1].id) : undefined}
            />
          ) : selectedPlanned ? (
            <PlannedDetail
              customer={selectedPlanned}
              depot={depot}
              finished={day.status === "finished"}
              onBack={closeDetail}
              onCollapse={() => setExpanded(true)}
            />
          ) : (
            <>
              {/* Day switcher, laid out like an app header */}
              <div className="flex items-center justify-between gap-2 px-5 pt-5">
                <button
                  type="button"
                  onClick={() => goToDate(shiftDateKey(date, -1))}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="اليوم السابق"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
                    <Navigation className="size-[18px] fill-current" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold">{formatDayLabel(date)}</div>
                    {isToday ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn("size-1.5 rounded-full", status.dot, position?.live && "animate-pulse")} />
                        {status.label}
                        {stats.lastActivity && replayAt == null ? ` · ${formatAgo(stats.lastActivity, now)}` : ""}
                      </div>
                    ) : (
                      <button type="button" onClick={() => goToDate(today)} className="text-[11px] text-primary hover:underline">
                        العودة إلى اليوم
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToDate(shiftDateKey(date, 1))}
                    disabled={isToday}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-25 disabled:hover:bg-transparent"
                    aria-label="اليوم التالي"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <span className="mx-0.5 h-5 w-px bg-border" />
                  <TkCollapseButton onClick={() => setExpanded(true)} />
                </div>
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
                      if (replayOpen) stopReplay();
                      else startReplay();
                    }}
                  >
                    <Play className="size-3.5" />
                    إعادة
                  </TkPillButton>
                </div>
              </div>

              <TkList listRef={listRef}>
                {rows.visited.length === 0 && rows.pending.length === 0 && (
                  <li className="py-12 text-center text-sm text-muted-foreground">
                    {isFuture || day.status === "not_started"
                      ? "لم يبدأ المندوب يومه بعد"
                      : day.status === "offline"
                        ? "حساب المندوب غير مفعّل"
                        : "لا توجد محلات مطابقة لهذا الفلتر"}
                  </li>
                )}
                {rows.visited.map((v, i) => (
                  <TkRow key={v.id} dataId={v.id} index={i} onClick={() => open(v.id)}>
                    <VisitRowBody visit={v} />
                  </TkRow>
                ))}
                {rows.pending.map((c, i) => (
                  <TkRow key={c.id} dataId={`planned-${c.id}`} index={rows.visited.length + i} muted onClick={() => open(`planned-${c.id}`)}>
                    <TkAvatar name={c.name} className="grayscale" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px]">{c.name}</div>
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {depot ? `${distanceKm(depot, [c.lat, c.lng]).toFixed(1)} كم من المستودع • ` : ""}
                        {day.status === "finished" ? "لم تتم زيارته" : "بانتظار الزيارة"}
                      </div>
                    </div>
                    <TkHex title="لم تتم زيارته">—</TkHex>
                  </TkRow>
                ))}
              </TkList>
            </>
          )}
        </TkSidebar>

        <TkMapArea expanded={expanded} onToggleExpand={() => setExpanded((e) => !e)} className="h-[460px] lg:h-auto">
          <TrackingMap
            className="absolute inset-0"
            center={center}
            pins={pins}
            routes={routes}
            position={position}
            vehicle={vehicle}
            onFollowBreak={() => setFollow(false)}
            depot={depot}
            selectedPinId={selectedId}
            onPinClick={open}
            onMapClick={() => setSelectedId(null)}
            fitKey={`${repId}|${date}`}
            view={view}
          >
            {/* Live status, floating at the top of the map */}
            <div
              className={cn("pointer-events-none absolute top-4 z-[1000] flex items-center gap-2", expanded ? "right-44" : "right-4")}
              dir="rtl"
            >
              <span className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs text-foreground shadow-md backdrop-blur">
                <span className={cn("size-2 rounded-full", status.dot, position?.live && "animate-pulse")} />
                {status.label}
                {day.status === "at_customer" && day.currentCustomer ? ` · ${day.currentCustomer}` : ""}
              </span>
              {stats.distanceKm > 0 && (
                <span className="rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground tabular-nums shadow-md backdrop-blur">
                  {stats.distanceKm} كم اليوم
                </span>
              )}
            </div>

            {replayOpen && canReplay && (
              <div
                dir="rtl"
                // Starts past the zoom buttons on the left.
                className="absolute right-4 bottom-4 left-20 z-[1000] flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-3 py-2.5 text-foreground shadow-xl backdrop-blur"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    // Finished? Play again from the morning.
                    if (!playing && (simRef.current ?? sliderMax) >= sliderMax) seek(sliderMin);
                    setPlaying((p) => !p);
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white"
                  aria-label={playing ? "إيقاف" : "تشغيل"}
                >
                  {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                </button>
                <input
                  type="range"
                  dir="ltr"
                  min={sliderMin}
                  max={sliderMax}
                  step={15_000}
                  value={Math.min(simAt ?? sliderMin, sliderMax)}
                  onChange={(e) => {
                    setPlaying(false);
                    seek(Number(e.target.value));
                  }}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                  aria-label="إعادة عرض اليوم"
                />
                <span className="w-14 shrink-0 text-center text-xs font-semibold tabular-nums">
                  {formatTime(Math.min(simAt ?? sliderMin, sliderMax))}
                </span>
                <button
                  type="button"
                  onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
                  className="h-8 w-11 shrink-0 rounded-lg border border-border text-xs font-semibold tabular-nums hover:border-primary/40 hover:text-primary"
                  title="سرعة العرض"
                >
                  ×{speed}
                </button>
                <button
                  type="button"
                  onClick={() => setFollow((f) => !f)}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                    follow ? "border-primary bg-primary text-white" : "border-border hover:border-primary/40 hover:text-primary",
                  )}
                  aria-label="متابعة السيارة"
                  title={follow ? "الكاميرا تتابع السيارة" : "متابعة السيارة بالكاميرا"}
                >
                  <LocateFixed className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={stopReplay}
                  className="h-8 shrink-0 rounded-lg border border-border px-3 text-xs hover:border-primary/40 hover:text-primary"
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

function VisitRowBody({ visit }: { visit: Visit }) {
  const amount = visitAmount(visit);
  return (
    <>
      <TkAvatar name={visit.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px]">{visit.name}</div>
        <div className="truncate text-[11.5px] text-muted-foreground">
          <span className="tabular-nums">{formatTime(visit.arrivedAt)}</span>
          {" • "}
          <span style={{ color: toneOf(visit.main.type) }}>
            {SHORT_LABEL[visit.main.type]}
            {amount ? ` ${amount.toLocaleString("en")}` : ""}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <TkHex title={`الزيارة رقم ${visit.index}`}>{visit.index}</TkHex>
        <span className="text-[10px] text-muted-foreground tabular-nums">{visit.legKm} كم</span>
      </div>
    </>
  );
}

function VisitDetail({
  visit,
  cameFrom,
  currency,
  repId,
  onBack,
  onCollapse,
  onPrev,
  onNext,
}: {
  visit: Visit;
  cameFrom: string;
  currency: string;
  repId: string;
  onBack: () => void;
  onCollapse: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const meta = ACTIVITY_META[visit.main.type];
  const amount = visitAmount(visit);
  const last = visit.items[visit.items.length - 1];
  return (
    <TkDetail
      key={visit.id}
      onBack={onBack}
      onCollapse={onCollapse}
      backLabel="كل المحلات"
      name={visit.name}
      nameHref={visit.customerId ? `/customers/detail?id=${visit.customerId}` : undefined}
      sub={
        <>
          الزيارة رقم {visit.index} •{" "}
          <span style={{ color: toneOf(visit.main.type) }}>الوصول {formatTime(visit.arrivedAt)}</span>
        </>
      }
      stats={[
        { icon: <Receipt />, label: "المبلغ", value: amount ? compactNumber(amount) : "—", tone: ACTIVITY_TONE[visit.main.type] },
        { icon: <Clock />, label: "المدة", value: formatDuration(Math.max(last.time - visit.arrivedAt, 0) + 2 * 60_000) },
        { icon: <Route />, label: "الطريق", value: `${visit.legKm} كم` },
      ]}
      title={amount ? `${meta.label} بقيمة ${formatMoney(amount, currency)}` : meta.label}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
            aria-label="الزيارة السابقة"
            title="الزيارة السابقة"
          >
            <ChevronRight className="size-4" />
          </button>
          <Link href={`/reps/detail?id=${repId}&tab=invoices`} className={tkButton}>
            فواتير المندوب
          </Link>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
            aria-label="الزيارة التالية"
            title="الزيارة التالية"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
      }
    >
      <TkTimeline
        items={[
          {
            key: "from",
            icon: cameFrom === "المستودع" ? <Warehouse /> : <Route />,
            title: `قادماً من ${cameFrom}`,
            meta: `مسافة الطريق ${visit.legKm} كم`,
          },
          ...visit.items.map((a) => ({
            key: a.id,
            icon: ACTIVITY_ICON[a.type],
            tone: toneOf(a.type),
            title: (
              <>
                {ACTIVITY_META[a.type].label}
                {a.amount ? <span className="font-semibold"> {formatMoney(a.amount, currency)}</span> : null}
              </>
            ),
            meta: (
              <>
                <span className="tabular-nums">{formatTime(a.time)}</span>
                {a.note ? ` · ${a.note}` : ""}
                {a.type === "new_customer" && a.customerName ? ` · ${a.customerName}` : ""}
              </>
            ),
          })),
        ]}
      />
    </TkDetail>
  );
}

function PlannedDetail({
  customer,
  depot,
  finished,
  onBack,
  onCollapse,
}: {
  customer: PlannedCustomer;
  depot: LatLng | null;
  finished: boolean;
  onBack: () => void;
  onCollapse: () => void;
}) {
  return (
    <TkDetail
      key={customer.id}
      onBack={onBack}
      onCollapse={onCollapse}
      backLabel="كل المحلات"
      name={customer.name}
      nameHref={customer.customerId ? `/customers/detail?id=${customer.customerId}` : undefined}
      sub={finished ? "لم تتم زيارته في هذا اليوم" : "بانتظار الزيارة"}
      stats={[
        { icon: <Clock />, label: "الحالة", value: finished ? "لم يُزر" : "قيد الانتظار", tone: finished ? "var(--tk-red)" : undefined },
        { icon: <Warehouse />, label: "من المستودع", value: depot ? `${distanceKm(depot, [customer.lat, customer.lng]).toFixed(1)} كم` : "—" },
        { icon: <Route />, label: "خط السير", value: "اليوم" },
      ]}
      title={finished ? "لم تتم زيارته اليوم" : "ضمن خط سير اليوم"}
    >
      <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
        {finished
          ? "كان مدرجاً في خط سير المندوب وفق أيام عمله، إلا أن اليوم انتهى دون زيارته."
          : "ستظهر تفاصيل الزيارة هنا فور وصول المندوب إليه."}
      </p>
    </TkDetail>
  );
}
