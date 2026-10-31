import type { LatLng, RepActivityType, RepLiveStatus, TrackPoint } from "../types";

/** Approximate city centers by Syrian governorate (same table as the rep app). */
const GOVERNORATE_CENTERS: Record<string, LatLng> = {
  "حلب": [36.2021, 37.1343],
  "دمشق": [33.5138, 36.2765],
  "ريف دمشق": [33.5138, 36.3],
  "حمص": [34.7324, 36.7137],
  "حماة": [35.1318, 36.7578],
  "اللاذقية": [35.5197, 35.7833],
  "طرطوس": [34.8886, 35.8866],
  "إدلب": [35.9306, 36.6339],
  "الرقة": [35.95, 39.0167],
  "دير الزور": [35.3333, 40.15],
  "الحسكة": [36.5, 40.75],
  "درعا": [32.6189, 36.1021],
  "السويداء": [32.7047, 36.5661],
  "القنيطرة": [33.1264, 35.8244],
};

export function getGovernorateCenter(governorate: string | null | undefined): LatLng {
  return (governorate && GOVERNORATE_CENTERS[governorate]) || GOVERNORATE_CENTERS["حلب"];
}

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pathDistanceKm(path: TrackPoint[]) {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distanceKm([path[i - 1].lat, path[i - 1].lng], [path[i].lat, path[i].lng]);
  }
  return Math.round(total * 10) / 10;
}

/** "YYYY-MM-DD" for a local date. */
export function toDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDateKey(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

export function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("ar-SY", {
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn",
  });
}

export function formatDayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ar-SY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    numberingSystem: "latn",
  });
}

/** "منذ 5 د" style relative label against `now`. */
export function formatAgo(ms: number, now: number) {
  const minutes = Math.max(0, Math.round((now - ms) / 60_000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `منذ ${hours} س ${rest} د` : `منذ ${hours} س`;
}

export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} د`;
  return rest ? `${hours} س ${rest} د` : `${hours} س`;
}

export const ACTIVITY_META: Record<
  RepActivityType,
  { label: string; color: string; soft: string }
> = {
  day_start: { label: "بداية الدوام", color: "#475569", soft: "bg-slate-500/10 text-slate-600" },
  invoice: { label: "فاتورة مبيع", color: "#1d4ed8", soft: "bg-blue-600/10 text-blue-700" },
  collection: { label: "تحصيل دفعة", color: "#059669", soft: "bg-emerald-600/10 text-emerald-700" },
  return: { label: "مرتجع", color: "#dc2626", soft: "bg-red-600/10 text-red-600" },
  new_customer: { label: "زبون جديد", color: "#7c3aed", soft: "bg-violet-600/10 text-violet-700" },
  no_sale: { label: "زيارة دون بيع", color: "#d97706", soft: "bg-amber-500/15 text-amber-700" },
  day_end: { label: "نهاية الدوام", color: "#475569", soft: "bg-slate-500/10 text-slate-600" },
};

export const STATUS_META: Record<RepLiveStatus, { label: string; className: string; dot: string }> = {
  moving: { label: "في الطريق", className: "bg-blue-600/10 text-blue-700", dot: "bg-blue-600" },
  at_customer: { label: "لدى زبون", className: "bg-emerald-600/10 text-emerald-700", dot: "bg-emerald-600" },
  finished: { label: "أنهى يومه", className: "bg-slate-500/10 text-slate-600", dot: "bg-slate-500" },
  not_started: { label: "لم يبدأ بعد", className: "bg-amber-500/15 text-amber-700", dot: "bg-amber-500" },
  offline: { label: "غير متصل", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
};

/** Distinct per-rep colors for the all-reps map. */
export const REP_COLORS = [
  "#1d4ed8",
  "#dc2626",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
];
