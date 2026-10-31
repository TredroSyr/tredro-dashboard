"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LayerGroup, Map as LeafletMap, Marker, Polyline } from "leaflet";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LatLng } from "../types";

/** Round avatar pin with a small stat badge under it (shop or rep). */
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  /** One letter inside the avatar. */
  letter: string;
  bg: string;
  fg: string;
  /** Inline SVG markup for the badge icon. */
  badgeIcon?: string;
  badgeText?: string;
  /** Tint for the badge text, e.g. a return in red. */
  badgeColor?: string;
  dimmed?: boolean;
  /** Pulsing ring — a rep out in the field right now. */
  live?: boolean;
}

export interface MapRoute {
  id: string;
  points: LatLng[];
  /** `trail` is the quiet whole-day line, `route` the selected road in Tredro blue. */
  variant: "trail" | "route";
}

interface TrackingMapProps {
  center: LatLng;
  pins?: MapPin[];
  routes?: MapRoute[];
  /** The rep's current spot; `heading` (degrees from north) turns the car. */
  position?: { lat: number; lng: number; live: boolean; heading?: number | null } | null;
  /**
   * The car during a replay. Moved every animation frame on its own marker, so
   * it glides without redrawing the rest of the map. `follow` keeps the camera on it.
   */
  vehicle?: { lat: number; lng: number; heading: number; follow: boolean; tailFrom?: LatLng | null } | null;
  /** The user dragged the map while it was following the car. */
  onFollowBreak?: () => void;
  depot?: LatLng | null;
  selectedPinId?: string | null;
  onPinClick?: (id: string) => void;
  onMapClick?: () => void;
  /** Bounds are refitted (and pins pop in) whenever this changes, not on every redraw. */
  fitKey: string;
  /** Zoom to show these points whenever `key` changes — the selected route, a shop… */
  view?: { key: string; points: LatLng[] } | null;
  className?: string;
  children?: ReactNode;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Top-down car pointing north; the marker rotates it to the driving direction.
const carSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="4.5" fill="currentColor"/><path d="M8 8.6Q12 6.6 16 8.6V11Q12 9.8 8 11Z" fill="#fff" opacity=".92"/><rect x="8.3" y="16.2" width="7.4" height="2.6" rx="1.1" fill="#fff" opacity=".7"/><rect x="7.2" y="2.9" width="2.4" height="1.3" rx=".6" fill="#fff" opacity=".85"/><rect x="14.4" y="2.9" width="2.4" height="1.3" rx=".6" fill="#fff" opacity=".85"/></svg>`;

const carHtml = (live: boolean, heading: number) =>
  `<div class="tm-car${live ? " tm-car--live" : ""}"><span class="tm-car__pulse"></span><span class="tm-car__disc"></span><span class="tm-car__body" style="transform:rotate(${heading}deg)">${carSvg}</span></div>`;

function pinHtml(pin: MapPin, selected: boolean, enterIndex: number | null) {
  const cls = [
    "tm-pin",
    selected && "tm-pin--active",
    pin.dimmed && "tm-pin--dim",
    pin.live && "tm-pin--live",
    enterIndex != null && "tm-pin--enter",
  ]
    .filter(Boolean)
    .join(" ");
  const badge =
    pin.badgeText || pin.badgeIcon
      ? `<span class="tm-pin__badge"${pin.badgeColor ? ` style="--bc:${pin.badgeColor}"` : ""}>${pin.badgeIcon ?? ""}${
          pin.badgeText ? `<span>${escapeHtml(pin.badgeText)}</span>` : ""
        }</span>`
      : "";
  return `
    <div class="${cls}" style="--pin-bg:${pin.bg};--pin-fg:${pin.fg};--d:${(enterIndex ?? 0) * 60}ms">
      <span class="tm-pin__avatar"><span class="tm-pin__ring"></span>${escapeHtml(pin.letter)}</span>
      ${badge}
    </div>`;
}

/** Draws a line on like a pen stroke. */
function drawOn(el: SVGPathElement | undefined) {
  if (!el?.getTotalLength) return;
  const len = el.getTotalLength();
  el.style.strokeDasharray = `${len}`;
  el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
    duration: Math.min(1400, 500 + len * 1.1),
    easing: "cubic-bezier(.45,.05,.25,1)",
  }).onfinish = () => {
    el.style.strokeDasharray = "";
  };
}

export function TrackingMap({
  center,
  pins = [],
  routes = [],
  position,
  vehicle,
  onFollowBreak,
  depot,
  selectedPinId,
  onPinClick,
  onMapClick,
  fitKey,
  view,
  className,
  children,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const enteredKeyRef = useRef<string | null>(null);
  const drawnRouteRef = useRef<string | null>(null);
  /** What "توسيط" returns to: the selected route, or the whole day. */
  const homeRef = useRef<LatLng[] | null>(null);
  const callbacksRef = useRef({ onPinClick, onMapClick, onFollowBreak });
  const vehicleRef = useRef<{ marker: Marker; tail: Polyline; tailCasing: Polyline; body: HTMLElement | null } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onPinClick, onMapClick, onFollowBreak };
  });

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 90,
      });
      // Our own zoom/center buttons are drawn in React below; keep only the OSM credit (required by its license).
      map.attributionControl.setPrefix(false);
      // Same OSM tiles as the rep app; .map-surface gives them the Tredro blue tint (light + dark).
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: "abc",
        attribution: "© OpenStreetMap contributors",
        keepBuffer: 4,
      }).addTo(map);
      map.on("click", () => callbacksRef.current.onMapClick?.());
      // Grabbing the map while it follows the car hands the camera back to the user.
      map.on("dragstart", () => callbacksRef.current.onFollowBreak?.());

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
      observer.observe(containerRef.current);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      vehicleRef.current = null;
      fittedKeyRef.current = null;
      enteredKeyRef.current = null;
      drawnRouteRef.current = null;
    };
    // Center only seeds the initial view; later fits come from the data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw every overlay from scratch — a day holds a few hundred points at most.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();

    // Pins pop in one by one only the first time a view (rep, day…) is drawn.
    const entering = enteredKeyRef.current !== fitKey;
    enteredKeyRef.current = fitKey;

    routes
      .filter((r) => r.variant === "trail" && r.points.length > 1)
      .forEach((r) => {
        L.polyline(r.points, {
          className: "tm-trail",
          weight: 3,
          interactive: false,
          dashArray: "2 8",
          lineCap: "round",
        }).addTo(layer);
      });

    const selected = routes.filter((r) => r.variant === "route" && r.points.length > 1);
    selected.forEach((r) => {
      // Two layers like the rep app: a light casing under the blue line.
      const casing = L.polyline(r.points, { className: "tm-route-casing", weight: 11, interactive: false, lineJoin: "round", lineCap: "round" }).addTo(layer);
      const line = L.polyline(r.points, { className: "tm-route", weight: 6, interactive: false, lineJoin: "round", lineCap: "round" }).addTo(layer);
      if (drawnRouteRef.current !== r.id) {
        drawnRouteRef.current = r.id;
        drawOn(casing.getElement() as SVGPathElement | undefined);
        drawOn(line.getElement() as SVGPathElement | undefined);
      }
    });
    if (!selected.length) drawnRouteRef.current = null;

    if (depot) {
      L.marker(depot, {
        icon: L.divIcon({ html: `<div class="tm-depot">م</div>`, className: "", iconSize: [0, 0] }),
        zIndexOffset: 50,
      })
        .bindTooltip("المستودع", { direction: "top", offset: [0, -16] })
        .addTo(layer);
    }

    pins.forEach((pin, i) => {
      const isSelected = pin.id === selectedPinId;
      L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({ html: pinHtml(pin, isSelected, entering ? i : null), className: "", iconSize: [0, 0] }),
        zIndexOffset: isSelected ? 1200 : pin.dimmed ? 0 : 200,
        riseOnHover: true,
      })
        .on("click", () => callbacksRef.current.onPinClick?.(pin.id))
        .addTo(layer);
    });

    if (position) {
      L.marker([position.lat, position.lng], {
        icon: L.divIcon({
          html: carHtml(position.live, position.heading ?? 0),
          className: "",
          iconSize: [0, 0],
        }),
        zIndexOffset: 2000,
      })
        .bindTooltip(position.live ? "مكان المندوب الآن" : "آخر موقع", { direction: "top", offset: [0, -24] })
        .addTo(layer);
    }

    if (fittedKeyRef.current !== fitKey) {
      const points: LatLng[] = [
        ...routes.flatMap((r) => r.points),
        ...pins.map((p) => [p.lat, p.lng] as LatLng),
        ...(position ? [[position.lat, position.lng] as LatLng] : []),
      ];
      if (points.length) {
        fittedKeyRef.current = fitKey;
        homeRef.current = points;
        map.fitBounds(L.latLngBounds(points), { padding: [70, 70], maxZoom: 16, animate: false });
      }
    }
  }, [ready, pins, routes, position, depot, selectedPinId, fitKey]);

  // Bring the selected route/shop fully into view.
  const viewKey = view?.key;
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !view || !view.points.length) return;
    homeRef.current = view.points;
    flyToPoints(view.points);
    // Only when a new thing is selected, not on every data tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, viewKey]);

  // Replay car: its own marker + a short blue tail back to the last GPS fix, moved every frame.
  const tailKey = vehicle?.tailFrom ? vehicle.tailFrom.join(",") : "";
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    if (!vehicle) {
      const v = vehicleRef.current;
      if (v) {
        v.marker.remove();
        v.tail.remove();
        v.tailCasing.remove();
        vehicleRef.current = null;
      }
      return;
    }

    const here: LatLng = [vehicle.lat, vehicle.lng];
    let v = vehicleRef.current;
    if (!v) {
      const line = { interactive: false, lineCap: "round" as const, lineJoin: "round" as const };
      const tailCasing = L.polyline([], { ...line, className: "tm-route-casing", weight: 11 }).addTo(map);
      const tail = L.polyline([], { ...line, className: "tm-route", weight: 6 }).addTo(map);
      const marker = L.marker(here, {
        icon: L.divIcon({ html: carHtml(true, vehicle.heading), className: "", iconSize: [0, 0] }),
        zIndexOffset: 3000,
        interactive: false,
      }).addTo(map);
      v = { marker, tail, tailCasing, body: marker.getElement()?.querySelector<HTMLElement>(".tm-car__body") ?? null };
      vehicleRef.current = v;
      // Start the ride close enough to see the streets.
      if (vehicle.follow) map.setView(here, Math.max(map.getZoom(), 16), { animate: true });
    } else {
      v.marker.setLatLng(here);
      if (v.body) v.body.style.transform = `rotate(${vehicle.heading}deg)`;
      if (vehicle.follow) map.panTo(here, { animate: false });
    }

    const tail = vehicle.tailFrom ? [vehicle.tailFrom, here] : [];
    v.tail.setLatLngs(tail);
    v.tailCasing.setLatLngs(tail);
    // Driven by the vehicle's values, not the object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, vehicle == null, vehicle?.lat, vehicle?.lng, vehicle?.heading, vehicle?.follow, tailKey]);

  function flyToPoints(points: LatLng[]) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !points.length) return;
    if (points.length === 1) {
      map.flyTo(points[0], Math.max(map.getZoom(), 16), { duration: 0.6 });
    } else {
      map.flyToBounds(L.latLngBounds(points), { padding: [90, 90], maxZoom: 17, duration: 0.7 });
    }
  }

  return (
    <div className={cn("tracking-map map-surface relative isolate overflow-hidden", className)} dir="ltr">
      <div ref={containerRef} className="absolute inset-0" />
      {children}

      {/* Zoom + recenter, in the dashboard's own style */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col overflow-hidden rounded-xl border border-border bg-card/95 text-foreground shadow-md backdrop-blur">
        <MapButton label="تكبير" onClick={() => mapRef.current?.zoomIn()}>
          <Plus className="size-4" />
        </MapButton>
        <MapButton label="تصغير" onClick={() => mapRef.current?.zoomOut()}>
          <Minus className="size-4" />
        </MapButton>
        <MapButton label="توسيط" onClick={() => homeRef.current && flyToPoints(homeRef.current)}>
          <LocateFixed className="size-4" />
        </MapButton>
      </div>
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted hover:text-primary"
    >
      {children}
    </button>
  );
}
