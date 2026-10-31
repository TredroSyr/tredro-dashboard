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

const samePoint = (p: TrackPoint, lat: number, lng: number) => p.lat === lat && p.lng === lng;

/** Group the day's activities into shop visits and cut the GPS path into the leg leading to each. */
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
      // Legs end exactly on the shop's coordinates; the next one starts after the stay.
      let end = path.findIndex((p, i) => i >= cursor && samePoint(p, lat, lng));
      if (end === -1) end = path.length - 1;
      const legPoints = path.slice(cursor, end + 1);
      cursor = end;
      while (cursor + 1 < path.length && samePoint(path[cursor + 1], lat, lng)) cursor++;
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
        arrivedAt: items[0].time,
        leg: legPoints.map((p) => [p.lat, p.lng] as LatLng),
        legKm: pathDistanceKm(legPoints),
        sales: sum("invoice"),
        collected: sum("collection"),
        returned: sum("return"),
      };
    });
}

export const visitAmount = (v: Visit) => v.sales || v.collected || v.returned;
