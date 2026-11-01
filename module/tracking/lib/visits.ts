import type { LatLng, RepActivity, RepActivityType, TrackPoint } from "../types";
import { pathDistanceKm } from "./geo";

/** The visit takes the look of the "most telling" thing that happened there. */
const STOP_PRIORITY: RepActivityType[] = ["no_sale", "return", "invoice", "collection", "new_customer"];

/** Short labels for rows and badges — the full ones don't fit next to an amount. */
export const SHORT_LABEL: Record<RepActivityType, string> = {
  day_start: "بداية الدوام",
  invoice: "فاتورة",
  collection: "تحصيل",
  return: "مرتجع",
  new_customer: "زبون جديد",
  no_sale: "دون بيع",
  day_end: "نهاية الدوام",
};

export interface Visit {
  id: string;
  index: number;
  name: string;
  /** Real customer id, when the shop is one of the rep's customers. */
  customerId?: number;
  lat: number;
  lng: number;
  items: RepActivity[];
  main: RepActivity;
  arrivedAt: number;
  /** The road driven from the previous stop (or the depot) to this shop. */
  leg: LatLng[];
  legKm: number;
  sales: number;
  collected: number;
  returned: number;
}

/**
 * Group the day's activities into shop visits and cut the GPS path into the
 * leg leading to each: everything driven after the previous stop's last
 * activity, up to this stop's first one.
 */
export function buildVisits(activities: RepActivity[], path: TrackPoint[]): Visit[] {
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
      const arrivedAt = items[0].time;
      const leftAt = items[items.length - 1].time;
      let end = cursor;
      while (end + 1 < path.length && path[end + 1].time <= arrivedAt) end++;
      const legPoints = path.slice(cursor, end + 1);
      // The next leg starts where the rep was when they finished here.
      cursor = end;
      while (cursor + 1 < path.length && path[cursor + 1].time <= leftAt) cursor++;
      const leg = legPoints.map((p) => [p.lat, p.lng] as LatLng);
      // Activities are pinned where they were recorded; end the line there.
      const tail = leg[leg.length - 1];
      if (!tail || tail[0] !== lat || tail[1] !== lng) leg.push([lat, lng]);
      const sum = (type: RepActivityType) =>
        items.filter((a) => a.type === type).reduce((s, a) => s + (a.amount ?? 0), 0);
      const shop = items.find((a) => a.type !== "new_customer") ?? items[0];
      return {
        id: `visit-${index}`,
        index,
        name: shop.customerName ?? "",
        customerId: shop.customerId,
        lat,
        lng,
        items,
        main,
        arrivedAt,
        leg,
        legKm: pathDistanceKm(legPoints),
        sales: sum("invoice"),
        collected: sum("collection"),
        returned: sum("return"),
      };
    });
}

export const visitAmount = (v: Visit) => v.sales || v.collected || v.returned;
