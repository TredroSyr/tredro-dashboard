export type LatLng = [number, number];

export type RepActivityType =
  | "day_start"
  | "invoice"
  | "collection"
  | "return"
  | "new_customer"
  | "no_sale"
  | "day_end";

/** One thing the rep did, pinned to where and when it happened. */
export interface RepActivity {
  id: string;
  type: RepActivityType;
  /** Epoch ms. */
  time: number;
  lat: number;
  lng: number;
  customerName?: string;
  /** Amount in the company currency, for invoice / collection / return. */
  amount?: number;
  note?: string;
  /** 1-based order of the customer visit this activity belongs to. */
  visitIndex?: number;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  /** Epoch ms. */
  time: number;
}

/** A customer planned for the day (from the rep's work days). */
export interface PlannedCustomer {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export type RepLiveStatus =
  | "not_started"
  | "moving"
  | "at_customer"
  | "finished"
  | "offline";

export interface RepDayStats {
  visits: number;
  planned: number;
  salesTotal: number;
  collectionsTotal: number;
  returnsTotal: number;
  invoicesCount: number;
  distanceKm: number;
  firstActivity: number | null;
  lastActivity: number | null;
}

/** A rep's day as seen at a given moment ("now" or a replay time). */
export interface RepDaySnapshot {
  repId: string;
  date: string;
  path: TrackPoint[];
  activities: RepActivity[];
  planned: PlannedCustomer[];
  /** Planned customers with no visit yet at this moment. */
  unvisited: PlannedCustomer[];
  position: TrackPoint | null;
  status: RepLiveStatus;
  /** Customer the rep is standing at, when status is at_customer. */
  currentCustomer?: string;
  stats: RepDayStats;
  /** Bounds of the whole day, for the replay slider. */
  dayStart: number | null;
  dayEnd: number | null;
}
