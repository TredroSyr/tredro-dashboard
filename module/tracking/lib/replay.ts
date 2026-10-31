import type { LatLng, TrackPoint } from "../types";

/** Compass bearing from a to b in degrees (0 = north, 90 = east) — what the car icon rotates by. */
export function bearing(a: LatLng, b: LatLng) {
  const dy = b[0] - a[0];
  const dx = (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180);
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/**
 * Where the rep was at time `t`, interpolated between GPS fixes so the car
 * glides instead of hopping. `heading` is null while standing still (at a shop),
 * so the car keeps facing the way it arrived. `lastFix` is the latest real point
 * at or before `t` — the blue line is drawn up to it, the car's tail covers the rest.
 */
export function pointAt(path: TrackPoint[], t: number): { at: LatLng; heading: number | null; lastFix: LatLng } | null {
  if (!path.length) return null;
  if (t <= path[0].time) return { at: [path[0].lat, path[0].lng], heading: null, lastFix: [path[0].lat, path[0].lng] };

  // Last fix at or before t (binary search; paths are sorted by time).
  let lo = 0;
  let hi = path.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (path[mid].time <= t) lo = mid;
    else hi = mid - 1;
  }
  const a = path[lo];
  const b = path[lo + 1];
  const lastFix: LatLng = [a.lat, a.lng];
  if (!b) return { at: lastFix, heading: null, lastFix };

  const f = Math.min(1, Math.max(0, (t - a.time) / Math.max(1, b.time - a.time)));
  const at: LatLng = [a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f];
  const moving = a.lat !== b.lat || a.lng !== b.lng;
  return { at, heading: moving ? bearing(lastFix, [b.lat, b.lng]) : null, lastFix };
}

/** Eases `from` toward `to` along the shorter way round the compass. */
export function turnToward(from: number, to: number, amount: number) {
  const diff = ((to - from + 540) % 360) - 180;
  return from + diff * amount;
}
