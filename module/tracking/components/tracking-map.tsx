"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
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
  /** The rep's current spot. */
  position?: { lat: number; lng: number; live: boolean } | null;
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

const truckSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2"/><path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;

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
  const callbacksRef = useRef({ onPinClick, onMapClick });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onPinClick, onMapClick };
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
          html: `<div class="tm-me${position.live ? " tm-me--live" : ""}"><span class="tm-me__pulse"></span><span class="tm-me__body">${truckSvg}</span></div>`,
          className: "",
          iconSize: [0, 0],
        }),
        zIndexOffset: 2000,
      })
        .bindTooltip(position.live ? "مكان المندوب الآن" : "آخر موقع", { direction: "top", offset: [0, -20] })
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
