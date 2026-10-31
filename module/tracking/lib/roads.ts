import type { LatLng } from "../types";

/**
 * Real street geometry for a day's drive, from the public OSRM server (the same
 * one the rep app routes with). One request per rep/day: depot → shops → depot,
 * returned as one polyline per leg. Cached in memory + sessionStorage.
 */

const memory = new Map<string, LatLng[][]>();
const SESSION_PREFIX = "tredro-road-legs:";

export const stopsKey = (stops: LatLng[]) => stops.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(";");

function readSession(key: string): LatLng[][] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    return raw ? (JSON.parse(raw) as LatLng[][]) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, legs: LatLng[][]) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(legs));
  } catch {
    // Storage full or blocked — the memory cache still covers this session.
  }
}

export async function fetchRoadLegs(stops: LatLng[], signal?: AbortSignal): Promise<LatLng[][]> {
  const key = stopsKey(stops);
  const cached = memory.get(key) ?? readSession(key);
  if (cached) {
    memory.set(key, cached);
    return cached;
  }

  const coords = stops.map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(";");
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=true&geometries=geojson`,
    signal ? { signal } : undefined,
  );
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = (await res.json()) as {
    code: string;
    routes?: { legs: { steps: { geometry: { coordinates: [number, number][] } }[] }[] }[];
  };
  const legs = json.routes?.[0]?.legs;
  if (json.code !== "Ok" || !legs || legs.length !== stops.length - 1) throw new Error("no route");

  const result = legs.map((leg) => {
    const points: LatLng[] = [];
    leg.steps.forEach((step) =>
      step.geometry.coordinates.forEach(([lng, lat]) => {
        const last = points[points.length - 1];
        if (!last || last[0] !== lat || last[1] !== lng) points.push([lat, lng]);
      }),
    );
    return points;
  });

  memory.set(key, result);
  writeSession(key, result);
  return result;
}
