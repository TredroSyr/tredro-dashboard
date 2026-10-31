/**
 * DUMMY DATA — there is no rep GPS tracking on the backend yet. Everything here
 * is generated deterministically from (repId, date) so a rep's day looks the
 * same on every reload and on both the home section and the rep's tracking tab.
 * The shops are the rep's real customers when they're passed in (so names link
 * to real customer pages), and once road geometry is fetched the drive follows
 * real streets. Replace `buildRepDay` with the real endpoint once it exists; the
 * snapshot shape in ../types is what the UI consumes.
 */
import type {
  LatLng,
  PlannedCustomer,
  RepActivity,
  RepActivityType,
  RepDaySnapshot,
  RepLiveStatus,
  TrackPoint,
} from "../types";
import { distanceKm, pathDistanceKm } from "./geo";

const MINUTE = 60_000;

/** A real customer of the rep, used as a shop on the day's route. */
export interface DayCustomer {
  id: number;
  name: string;
}

const SHOP_NAMES = [
  "سوبر ماركت أبو أحمد",
  "بقالية الأمانة",
  "ماركت النور",
  "محلات الشهباء",
  "سوبر ماركت الريّان",
  "بقالية أبو خليل",
  "مول الفرقان",
  "ماركت الياسمين",
  "محل أبو سمير",
  "بقالية السلام",
  "ماركت البركة",
  "سوبر ماركت الحمدانية",
  "محلات الإخلاص",
  "بقالية الوفاء",
  "ماركت الجميلية",
  "محل أبو عمر",
  "سوبر ماركت الأندلس",
  "بقالية الخير",
  "ماركت السبيل",
  "محلات العزيزية",
  "بقالية أم محمد",
  "ماركت الزهراء",
];

const NO_SALE_NOTES = [
  "المحل مغلق",
  "صاحب المحل غير موجود",
  "لديه بضاعة كافية",
  "طلب الزيارة في الأسبوع القادم",
];

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small seeded PRNG so the dummy day is stable across reloads. */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Local-midnight epoch ms for a "YYYY-MM-DD" date. */
function dayStartMs(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

interface FullDay {
  path: TrackPoint[];
  activities: RepActivity[];
  planned: PlannedCustomer[];
  /** Time window spent at each visited customer, keyed by planned id. */
  stays: { customerId: string; name: string; from: number; to: number }[];
  /** Depot → each visited shop → depot: the waypoints to fetch real roads for. */
  stops: LatLng[];
  dayStart: number;
  dayEnd: number;
}

/**
 * One drive between two stops, spread over the leg's minutes. With `road` (real
 * street geometry) the points follow the streets; without it, an L-shaped
 * stand-in until the roads load. The leg's duration only depends on the
 * straight-line distance, so the day's timings don't change when roads arrive.
 */
function buildLeg(from: LatLng, to: LatLng, startTime: number, rand: () => number, road?: LatLng[]): TrackPoint[] {
  const km = distanceKm(from, to);
  // ~22 km/h through city traffic on streets ~35% longer than the straight line, plus parking.
  const minutes = Math.max(3, Math.round(((km * 1.35) / 22) * 60) + 2);
  const endTime = startTime + minutes * MINUTE;

  if (road && road.length > 1) {
    const pts: LatLng[] = [from, ...road, to];
    const cumulative = [0];
    for (let i = 1; i < pts.length; i++) cumulative.push(cumulative[i - 1] + distanceKm(pts[i - 1], pts[i]));
    const total = cumulative[cumulative.length - 1] || 1;
    // Same pace along the whole street: time grows with distance driven.
    return pts.slice(1).map((p, i) => ({
      lat: p[0],
      lng: p[1],
      time: startTime + Math.round(((cumulative[i + 1] / total) * (endTime - startTime)) / 1000) * 1000,
    }));
  }

  const corner: LatLng = rand() > 0.5 ? [from[0], to[1]] : [to[0], from[1]];
  const mid: LatLng = [corner[0] + (rand() - 0.5) * 0.0015, corner[1] + (rand() - 0.5) * 0.0015];
  const points: TrackPoint[] = [];
  const half = Math.max(1, Math.floor(minutes / 2));
  for (let i = 1; i <= minutes; i++) {
    const [a, b, t] = i <= half ? [from, mid, i / half] : [mid, to, (i - half) / (minutes - half)];
    points.push({
      lat: a[0] + (b[0] - a[0]) * t,
      lng: a[1] + (b[1] - a[1]) * t,
      time: startTime + i * MINUTE,
    });
  }
  points[points.length - 1] = { lat: to[0], lng: to[1], time: endTime };
  return points;
}

function buildFullDay(
  repId: string,
  date: string,
  center: LatLng,
  customers: DayCustomer[] | undefined,
  roads: LatLng[][] | null | undefined,
): FullDay {
  const rand = seededRandom(hashString(`${repId}|${date}`));
  const repRand = seededRandom(hashString(`rep|${repId}`));
  // Leg shapes draw from their own sequence so they never shift the day's sales or times.
  const legRand = seededRandom(hashString(`legs|${repId}|${date}`));

  // Each rep owns a stable sector of the city; the depot sits near the center.
  const angle = repRand() * Math.PI * 2;
  const reach = 0.018 + repRand() * 0.02;
  const area: LatLng = [center[0] + Math.sin(angle) * reach, center[1] + Math.cos(angle) * reach];
  const depot: LatLng = [center[0] + (repRand() - 0.5) * 0.01, center[1] + (repRand() - 0.5) * 0.01];

  const wanted = 7 + Math.floor(rand() * 5);
  const source: { id?: number; name: string }[] = customers?.length ? customers : SHOP_NAMES.map((name) => ({ name }));
  const plannedCount = customers?.length ? Math.min(customers.length, wanted) : wanted;
  const shuffled = [...source].sort(() => rand() - 0.5);
  const planned: PlannedCustomer[] = Array.from({ length: plannedCount }, (_, i) => {
    const c = shuffled[i % shuffled.length];
    return {
      id: `${repId}-c${i}`,
      name: c.name,
      customerId: c.id,
      lat: area[0] + (rand() - 0.5) * 0.022,
      lng: area[1] + (rand() - 0.5) * 0.026,
    };
  });

  // Nearest-neighbour visiting order from the depot.
  const remaining = [...planned];
  const order: PlannedCustomer[] = [];
  let cursor: LatLng = depot;
  while (remaining.length) {
    let best = 0;
    remaining.forEach((c, i) => {
      if (distanceKm(cursor, [c.lat, c.lng]) < distanceKm(cursor, [remaining[best].lat, remaining[best].lng])) best = i;
    });
    const [next] = remaining.splice(best, 1);
    order.push(next);
    cursor = [next.lat, next.lng];
  }
  // A couple of planned customers are left for another day.
  const skipCount = order.length > 3 ? Math.floor(rand() * 3) : 0;
  const visits = order.slice(0, order.length - skipCount);
  const stops: LatLng[] = [depot, ...visits.map((c) => [c.lat, c.lng] as LatLng), depot];

  const base = dayStartMs(date);
  let t = base + (8 * 60 + Math.floor(rand() * 45)) * MINUTE;
  const dayStart = t;

  const activities: RepActivity[] = [
    {
      id: `${repId}-${date}-start`,
      type: "day_start",
      time: t,
      lat: depot[0],
      lng: depot[1],
      note: "حمّل البضاعة وانطلق من المستودع",
    },
  ];
  const path: TrackPoint[] = [{ lat: depot[0], lng: depot[1], time: t }];
  const stays: FullDay["stays"] = [];
  let pos: LatLng = depot;
  let newCustomerAdded = false;

  visits.forEach((customer, i) => {
    const target: LatLng = [customer.lat, customer.lng];
    const leg = buildLeg(pos, target, t, legRand, roads?.[i]);
    path.push(...leg);
    t = leg[leg.length - 1].time;
    pos = target;

    const arrive = t;
    const stayMinutes = 15 + Math.floor(rand() * 26);
    const visitIndex = i + 1;
    const at = (offset: number, type: RepActivityType, extra: Partial<RepActivity>) =>
      activities.push({
        id: `${repId}-${date}-${i}-${type}`,
        type,
        time: arrive + offset * MINUTE,
        lat: customer.lat,
        lng: customer.lng,
        customerName: customer.name,
        customerId: customer.customerId,
        visitIndex,
        ...extra,
      });

    const roll = rand();
    if (roll < 0.55) {
      at(stayMinutes - 2, "invoice", { amount: roundTo(150_000 + rand() * 2_350_000, 5_000) });
    } else if (roll < 0.7) {
      at(stayMinutes - 4, "invoice", { amount: roundTo(200_000 + rand() * 1_800_000, 5_000) });
      at(stayMinutes - 1, "collection", { amount: roundTo(100_000 + rand() * 900_000, 5_000) });
    } else if (roll < 0.8) {
      at(stayMinutes - 1, "collection", { amount: roundTo(100_000 + rand() * 1_200_000, 5_000) });
    } else if (roll < 0.88) {
      at(stayMinutes - 1, "return", {
        amount: roundTo(40_000 + rand() * 300_000, 5_000),
        note: "بضاعة منتهية الصلاحية",
      });
    } else {
      at(Math.min(stayMinutes, 4), "no_sale", {
        note: NO_SALE_NOTES[Math.floor(rand() * NO_SALE_NOTES.length)],
      });
    }

    // Once in a while the rep signs up a neighbouring shop on the way.
    if (!newCustomerAdded && i > 1 && rand() < 0.18) {
      newCustomerAdded = true;
      at(stayMinutes, "new_customer", {
        customerName: SHOP_NAMES[(plannedCount + 1) % SHOP_NAMES.length],
        customerId: undefined,
        note: "زبون جديد عبر كود الإحالة",
      });
    }

    t = arrive + (stayMinutes + 1) * MINUTE;
    path.push({ lat: customer.lat, lng: customer.lng, time: t });
    // Coffee, phone calls, waiting on the owner — time between stops isn't all driving.
    t += Math.floor(rand() * 15) * MINUTE;
    stays.push({ customerId: customer.id, name: customer.name, from: arrive, to: t });

    // Lunch break around midday.
    if (i === Math.floor(visits.length / 2)) t += (30 + Math.floor(rand() * 25)) * MINUTE;
  });

  const back = buildLeg(pos, depot, t, legRand, roads?.[visits.length]);
  path.push(...back);
  t = back[back.length - 1].time;
  activities.push({
    id: `${repId}-${date}-end`,
    type: "day_end",
    time: t,
    lat: depot[0],
    lng: depot[1],
    note: "عاد إلى المستودع وأنهى يومه",
  });

  activities.sort((a, b) => a.time - b.time);
  return { path, activities, planned, stays, stops, dayStart, dayEnd: t };
}

const fullDayCache = new Map<string, FullDay>();

const customersKey = (customers?: DayCustomer[]) => (customers?.length ? customers.map((c) => c.id).join(".") : "");

function getFullDay(
  repId: string,
  date: string,
  center: LatLng,
  customers?: DayCustomer[],
  roads?: LatLng[][] | null,
) {
  const key = `${repId}|${date}|${center.join(",")}|${customersKey(customers)}|${roads ? "roads" : "plain"}`;
  let day = fullDayCache.get(key);
  if (!day) {
    day = buildFullDay(repId, date, center, customers, roads);
    fullDayCache.set(key, day);
  }
  return day;
}

/** The day's waypoints (depot → shops → depot), for fetching real street routes. */
export function dayStops({
  repId,
  date,
  center,
  customers,
}: {
  repId: string;
  date: string;
  center: LatLng;
  customers?: DayCustomer[];
}) {
  return getFullDay(repId, date, center, customers).stops;
}

const emptyStats = (planned: number) => ({
  visits: 0,
  planned,
  salesTotal: 0,
  collectionsTotal: 0,
  returnsTotal: 0,
  invoicesCount: 0,
  distanceKm: 0,
  firstActivity: null,
  lastActivity: null,
});

/**
 * The rep's day as it stands at `at` (epoch ms). Pass the current time for the
 * live view, or a replay time to scrub through the day. Future dates and
 * inactive reps come back empty. `roads` holds one street polyline per leg
 * (see `dayStops`); without it the legs are rough stand-ins.
 */
export function buildRepDay({
  repId,
  date,
  center,
  at,
  active = true,
  customers,
  roads,
}: {
  repId: string;
  date: string;
  center: LatLng;
  at: number;
  active?: boolean;
  customers?: DayCustomer[];
  roads?: LatLng[][] | null;
}): RepDaySnapshot {
  const empty = (status: RepLiveStatus, planned: PlannedCustomer[] = []): RepDaySnapshot => ({
    repId,
    date,
    path: [],
    activities: [],
    planned,
    unvisited: planned,
    position: null,
    status,
    stats: emptyStats(planned.length),
    dayStart: null,
    dayEnd: null,
  });

  if (!active) return empty("offline");
  const day = getFullDay(repId, date, center, customers, roads);
  if (at < day.dayStart) return { ...empty("not_started", day.planned), dayStart: day.dayStart, dayEnd: day.dayEnd };

  const path = day.path.filter((p) => p.time <= at);
  const activities = day.activities.filter((a) => a.time <= at);
  const position = path[path.length - 1] ?? null;
  const visitedIds = new Set(day.stays.filter((s) => s.from <= at).map((s) => s.customerId));
  const currentStay = day.stays.find((s) => s.from <= at && at < s.to);

  let status: RepLiveStatus = "moving";
  if (at >= day.dayEnd) status = "finished";
  else if (currentStay) status = "at_customer";

  const sum = (type: RepActivityType) =>
    activities.filter((a) => a.type === type).reduce((s, a) => s + (a.amount ?? 0), 0);
  const work = activities.filter((a) => a.type !== "day_start" && a.type !== "day_end");

  return {
    repId,
    date,
    path,
    activities,
    planned: day.planned,
    unvisited: day.planned.filter((c) => !visitedIds.has(c.id)),
    position,
    status,
    currentCustomer: currentStay?.name,
    stats: {
      visits: visitedIds.size,
      planned: day.planned.length,
      salesTotal: sum("invoice"),
      collectionsTotal: sum("collection"),
      returnsTotal: sum("return"),
      invoicesCount: activities.filter((a) => a.type === "invoice").length,
      distanceKm: pathDistanceKm(path),
      firstActivity: activities[0]?.time ?? null,
      lastActivity: (work[work.length - 1] ?? activities[activities.length - 1])?.time ?? null,
    },
    dayStart: day.dayStart,
    dayEnd: day.dayEnd,
  };
}
