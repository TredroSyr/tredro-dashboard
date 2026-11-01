import api from "@/lib/axios";
import type { NoSaleReason, RepActivityType, RepLiveStatus } from "../types";

/**
 * Raw shapes of the rep tracking API (docs/rep-tracking-api.md §4–5). Times are
 * ISO strings in Syria time, money is a fixed-precision string. The UI never
 * reads these directly — see lib/adapt.ts.
 */

export interface ApiPoint {
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface ApiPosition extends ApiPoint {
  heading: number | null;
  speed: number | null;
}

export interface ApiActivity {
  id: string;
  type: RepActivityType;
  at: string;
  latitude: number | null;
  longitude: number | null;
  customer: { id: number; name: string } | null;
  amount: string | null;
  note: string;
  reason: NoSaleReason | null;
  visit_index: number | null;
  ref: { kind: "sales_invoice" | "payment" | "return_invoice" | "customer" | "visit"; id: number } | null;
}

export interface ApiStats {
  visits: number;
  planned: number;
  sales_total: string;
  collections_total: string;
  returns_total: string;
  invoices_count: number;
  distance_km: number;
  first_activity: string | null;
  last_activity: string | null;
}

export interface ApiPlanned {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  visited: boolean;
}

interface ApiDayBase {
  rep_id: number;
  date: string;
  status: RepLiveStatus;
  current_customer: { id: number; name: string } | null;
  day_start: string | null;
  day_end: string | null;
  depot: { latitude: number; longitude: number } | null;
  position: ApiPosition | null;
  activities: ApiActivity[];
  stats: ApiStats;
}

/** §4.1 — one rep's day. */
export interface ApiRepDay extends ApiDayBase {
  path: ApiPoint[];
  planned: ApiPlanned[];
}

/** §4.2 — one row of "all reps now". */
export interface ApiLiveRep extends ApiDayBase {
  name: string;
  last_activity: ApiActivity | null;
  path_preview: ApiPoint[];
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getRepDay = async (repId: string | number, date: string): Promise<ApiRepDay> => {
  const response = await api.get<Envelope<ApiRepDay>>(`companies/reps/${repId}/tracking/`, { params: { date } });
  return response.data.data;
};

export const getRepsLive = async (): Promise<ApiLiveRep[]> => {
  const response = await api.get<Envelope<{ reps: ApiLiveRep[] }>>("companies/reps/tracking/live/");
  return response.data.data.reps;
};
