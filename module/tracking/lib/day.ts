/**
 * Turns the tracking API's days (docs/rep-tracking-api.md §4) into the
 * snapshot shape the UI draws, and cuts a day at any moment for the replay.
 * The server's own status / stats are used for the live edge; a replay time
 * recomputes them from what had happened by then.
 */
import type { ApiActivity, ApiLiveRep, ApiPoint, ApiRepDay, ApiStats } from "../api";
import type {
  LatLng,
  NoSaleReason,
  PlannedCustomer,
  RepActivity,
  RepActivityType,
  RepDaySnapshot,
  RepDayStats,
  TrackPoint,
} from "../types";
import { distanceKm, pathDistanceKm } from "./geo";

export const NO_SALE_REASON_LABEL: Record<NoSaleReason, string> = {
  shop_closed: "المحل مغلق",
  owner_absent: "صاحب المحل غير موجود",
  enough_stock: "لديه بضاعة كافية",
  come_back_later: "طلب العودة لاحقاً",
  other: "سبب آخر",
};

/** Same rule as the server (§6.2): within 60 m of a shop counts as being there. */
const AT_CUSTOMER_KM = 0.06;

/**
 * Epoch ms for an API time. Times may carry microseconds
 * (`…14:27:42.364813+03:00`); trimmed to milliseconds so every engine parses them.
 */
export function parseTime(iso: string): number {
  return Date.parse(iso.replace(/(\.\d{3})\d+/, "$1"));
}

const parseTimeOrNull = (iso: string | null) => (iso ? parseTime(iso) : null);

export const toTrackPoint = (p: ApiPoint): TrackPoint => ({
  lat: p.latitude,
  lng: p.longitude,
  time: parseTime(p.recorded_at),
});

export function toActivity(a: ApiActivity, fallback: LatLng | null): RepActivity {
  const reason = a.type === "no_sale" && a.reason ? NO_SALE_REASON_LABEL[a.reason] : null;
  const note = [reason, a.note?.trim()].filter(Boolean).join(" — ");
  return {
    id: a.id,
    type: a.type,
    time: parseTime(a.at),
    lat: a.latitude ?? fallback?.[0] ?? 0,
    lng: a.longitude ?? fallback?.[1] ?? 0,
    customerName: a.customer?.name,
    customerId: a.customer?.id,
    amount: a.amount != null ? Number(a.amount) : undefined,
    note: note || undefined,
    reason: a.reason,
    visitIndex: a.visit_index ?? undefined,
    ref: a.ref,
  };
}

export const toStats = (s: ApiStats): RepDayStats => ({
  visits: s.visits,
  planned: s.planned,
  salesTotal: Number(s.sales_total),
  collectionsTotal: Number(s.collections_total),
  returnsTotal: Number(s.returns_total),
  invoicesCount: s.invoices_count,
  distanceKm: s.distance_km,
  firstActivity: parseTimeOrNull(s.first_activity),
  lastActivity: parseTimeOrNull(s.last_activity),
});

/** The rep's day as the server sees it now — the live edge. Works for both §4.1 and §4.2 objects. */
export function adaptDay(day: ApiRepDay | ApiLiveRep): RepDaySnapshot {
  const depot: LatLng | null = day.depot ? [day.depot.latitude, day.depot.longitude] : null;
  const rawPath = "path" in day ? day.path : day.path_preview;
  const path = rawPath.map(toTrackPoint);
  const position = day.position ? toTrackPoint(day.position) : null;
  // A live point can land before the next REST read; keep the line reaching the car.
  if (position && (!path.length || path[path.length - 1].time < position.time)) path.push(position);
  const lastFix: LatLng | null = position ? [position.lat, position.lng] : depot;

  const rawPlanned = "planned" in day ? day.planned : [];
  const planned: PlannedCustomer[] = rawPlanned.map((c) => ({
    id: String(c.id),
    name: c.name,
    customerId: c.id,
    lat: c.latitude,
    lng: c.longitude,
  }));
  const visited = new Set(rawPlanned.filter((c) => c.visited).map((c) => c.id));

  return {
    repId: String(day.rep_id),
    date: day.date,
    path,
    activities: day.activities.map((a) => toActivity(a, a.type === "day_end" ? lastFix : depot)),
    planned,
    unvisited: planned.filter((c) => !visited.has(c.customerId)),
    position,
    status: day.status,
    currentCustomer: day.current_customer?.name,
    depot,
    stats: toStats(day.stats),
    dayStart: parseTimeOrNull(day.day_start),
    dayEnd: parseTimeOrNull(day.day_end),
  };
}

/** The day as it stood at `at` (epoch ms) — for scrubbing the replay. */
export function sliceDay(day: RepDaySnapshot, at: number): RepDaySnapshot {
  if (day.dayStart == null || at < day.dayStart) {
    return {
      ...day,
      path: [],
      activities: [],
      unvisited: day.planned,
      position: null,
      status: "not_started",
      currentCustomer: undefined,
      stats: { ...day.stats, visits: 0, salesTotal: 0, collectionsTotal: 0, returnsTotal: 0, invoicesCount: 0, distanceKm: 0, firstActivity: null, lastActivity: null },
    };
  }

  const path = day.path.filter((p) => p.time <= at);
  const activities = day.activities.filter((a) => a.time <= at);
  const position = path[path.length - 1] ?? null;
  const visitedIds = new Set(activities.map((a) => a.customerId).filter((id) => id != null));

  let status: RepDaySnapshot["status"] = "moving";
  let currentCustomer: string | undefined;
  if (day.dayEnd != null && at >= day.dayEnd) status = "finished";
  else if (position) {
    const here: LatLng = [position.lat, position.lng];
    const shop =
      day.planned.find((c) => c.lat != null && c.lng != null && distanceKm(here, [c.lat, c.lng]) <= AT_CUSTOMER_KM)?.name ??
      [...activities].reverse().find((a) => a.customerName && distanceKm(here, [a.lat, a.lng]) <= AT_CUSTOMER_KM)?.customerName;
    if (shop) {
      status = "at_customer";
      currentCustomer = shop;
    }
  }

  const sum = (type: RepActivityType) =>
    activities.filter((a) => a.type === type).reduce((s, a) => s + (a.amount ?? 0), 0);

  return {
    ...day,
    path,
    activities,
    unvisited: day.planned.filter((c) => !visitedIds.has(c.customerId)),
    position,
    status,
    currentCustomer,
    stats: {
      visits: activities.reduce((m, a) => Math.max(m, a.visitIndex ?? 0), 0),
      planned: day.planned.length,
      salesTotal: sum("invoice"),
      collectionsTotal: sum("collection"),
      returnsTotal: sum("return"),
      invoicesCount: activities.filter((a) => a.type === "invoice").length,
      distanceKm: pathDistanceKm(path),
      firstActivity: activities[0]?.time ?? null,
      lastActivity: activities[activities.length - 1]?.time ?? null,
    },
  };
}

/** An empty day — while loading, or for a date that hasn't come yet. */
export function emptyDay(repId: string, date: string): RepDaySnapshot {
  return {
    repId,
    date,
    path: [],
    activities: [],
    planned: [],
    unvisited: [],
    position: null,
    status: "not_started",
    depot: null,
    stats: {
      visits: 0,
      planned: 0,
      salesTotal: 0,
      collectionsTotal: 0,
      returnsTotal: 0,
      invoicesCount: 0,
      distanceKm: 0,
      firstActivity: null,
      lastActivity: null,
    },
    dayStart: null,
    dayEnd: null,
  };
}
