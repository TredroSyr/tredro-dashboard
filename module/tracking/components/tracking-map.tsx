"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/use-theme-store";
import type { LatLng } from "../types";

/** Round avatar pin with a small stat badge under it (shop or rep). */
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  /** One or two letters inside the avatar. */
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
  /** `trail` is the quiet whole-day line, `glow` the highlighted neon leg. */
  variant: "trail" | "glow";
}

export interface MapCard {
  lat: number;
  lng: number;
  /** Where the highlighted route comes from — the card opens on the other side so it doesn't hide it. */
  from?: LatLng | null;
  content: ReactNode;
}

interface TrackingMapProps {
  center: LatLng;
  pins?: MapPin[];
  routes?: MapRoute[];
  /** The rep's current spot (single-rep view). */
  position?: { lat: number; lng: number; live: boolean } | null;
  depot?: LatLng | null;
  selectedPinId?: string | null;
  onPinClick?: (id: string) => void;
  onMapClick?: () => void;
  /** Floating detail card anchored next to a point. */
  card?: MapCard | null;
  /** Bounds are refitted (and pins pop in) whenever this changes, not on every redraw. */
  fitKey: string;
  /** Fly here whenever `key` changes. */
  focus?: { lat: number; lng: number; key: number; zoom?: number; soft?: boolean } | null;
  className?: string;
  children?: ReactNode;
}

// Esri's keyless gray canvases: quiet streets and labels, so the pins carry the picture.
const TILES = {
  light: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};
const CARD_WIDTH = 300;
const CARD_GAP = 34;

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
      ? `<span class="tm-pin__badge"${pin.badgeColor ? ` style="--bc:${pin.badgeColor}"` : ""}>${pin.badgeIcon ?? ""}<span>${escapeHtml(pin.badgeText ?? "")}</span></span>`
      : "";
  return `
    <div class="${cls}" style="--pin-bg:${pin.bg};--pin-fg:${pin.fg};--d:${(enterIndex ?? 0) * 70}ms">
      <span class="tm-pin__avatar"><span class="tm-pin__ring"></span>${escapeHtml(pin.letter)}</span>
      ${badge}
    </div>`;
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
  card,
  fitKey,
  focus,
  className,
  children,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const tilesRef = useRef<TileLayer | null>(null);
  const theme = useThemeStore((state) => state.theme);
  const themeRef = useRef(theme);
  const fittedKeyRef = useRef<string | null>(null);
  const enteredKeyRef = useRef<string | null>(null);
  const drawnGlowRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onPinClick, onMapClick });
  const [ready, setReady] = useState(false);
  const [cardPoint, setCardPoint] = useState<{ x: number; y: number; fromX: number | null; w: number; h: number } | null>(null);

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
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      tilesRef.current = L.tileLayer(TILES[themeRef.current], {
        maxZoom: 19,
        maxNativeZoom: 16,
        attribution: "Esri, HERE, Garmin, © OpenStreetMap contributors",
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
      tilesRef.current = null;
      fittedKeyRef.current = null;
      enteredKeyRef.current = null;
      drawnGlowRef.current = null;
    };
    // Center only seeds the initial view; later fits come from the data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the dashboard's light/dark switch.
  useEffect(() => {
    themeRef.current = theme;
    tilesRef.current?.setUrl(TILES[theme]);
  }, [theme]);

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
        L.polyline(r.points, { className: "tm-trail", weight: 3, interactive: false, dashArray: "1 7", lineCap: "round" }).addTo(layer);
      });

    routes
      .filter((r) => r.variant === "glow" && r.points.length > 1)
      .forEach((r) => {
        const halo = L.polyline(r.points, { className: "tm-glow-halo", weight: 14, interactive: false, lineJoin: "round" }).addTo(layer);
        const core = L.polyline(r.points, { className: "tm-glow", weight: 4, interactive: false, lineJoin: "round", lineCap: "round" }).addTo(layer);
        // Draw the line on like a pen stroke, once per newly selected leg.
        if (drawnGlowRef.current !== r.id) {
          drawnGlowRef.current = r.id;
          [halo, core].forEach((line) => {
            const el = line.getElement() as SVGPathElement | undefined;
            if (!el?.getTotalLength) return;
            const len = el.getTotalLength();
            el.style.strokeDasharray = `${len}`;
            el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
              duration: Math.min(1400, 500 + len * 1.2),
              easing: "cubic-bezier(.45,.05,.25,1)",
            }).onfinish = () => {
              el.style.strokeDasharray = "";
            };
          });
        }
      });
    if (!routes.some((r) => r.variant === "glow")) drawnGlowRef.current = null;

    if (depot) {
      L.marker(depot, {
        icon: L.divIcon({ html: `<div class="tm-depot">م</div>`, className: "", iconSize: [0, 0] }),
        zIndexOffset: 50,
      })
        .bindTooltip("المستودع", { direction: "top", offset: [0, -16] })
        .addTo(layer);
    }

    pins.forEach((pin, i) => {
      const selected = pin.id === selectedPinId;
      L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({ html: pinHtml(pin, selected, entering ? i : null), className: "", iconSize: [0, 0] }),
        zIndexOffset: selected ? 1200 : pin.dimmed ? 0 : 200,
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
        map.fitBounds(L.latLngBounds(points), { padding: [70, 70], maxZoom: 16, animate: false });
      }
    }
  }, [ready, pins, routes, position, depot, selectedPinId, fitKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    if (focus.soft) {
      // Selecting from the list: leave the view alone unless the point is off screen.
      if (map.getBounds().pad(-0.12).contains([focus.lat, focus.lng])) return;
      map.flyTo([focus.lat, focus.lng], map.getZoom(), { duration: 0.6 });
      return;
    }
    map.flyTo([focus.lat, focus.lng], focus.zoom ?? Math.max(map.getZoom(), 15), { duration: 0.7 });
    // Re-fly on every request, even to the same point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focus?.key]);

  // Keep the floating card glued to its point while the map pans and zooms.
  const cardLat = card?.lat;
  const cardLng = card?.lng;
  const cardFrom = card?.from ? card.from.join(",") : null;
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || cardLat == null || cardLng == null) {
      setCardPoint(null);
      return;
    }
    const update = () => {
      const p = map.latLngToContainerPoint([cardLat, cardLng]);
      const from = cardFrom ? map.latLngToContainerPoint(cardFrom.split(",").map(Number) as LatLng) : null;
      const size = map.getSize();
      setCardPoint({ x: p.x, y: p.y, fromX: from ? from.x : null, w: size.x, h: size.y });
    };
    update();
    // No room on the side away from the route: slide the map so the card doesn't hide it.
    if (cardFrom) {
      const p = map.latLngToContainerPoint([cardLat, cardLng]);
      const from = map.latLngToContainerPoint(cardFrom.split(",").map(Number) as LatLng);
      const w = map.getSize().x;
      const need = CARD_GAP + CARD_WIDTH + 24;
      if (from.x > p.x && p.x < need) map.panBy([p.x - need, 0]);
      else if (from.x <= p.x && w - p.x < need) map.panBy([need - (w - p.x), 0]);
    }
    map.on("move zoom resize viewreset", update);
    return () => {
      map.off("move zoom resize viewreset", update);
    };
  }, [ready, cardLat, cardLng, cardFrom]);

  let cardStyle: React.CSSProperties | null = null;
  if (card && cardPoint) {
    // Open away from the incoming route when there's room; the map container is LTR.
    const fitsRight = cardPoint.x + CARD_GAP + CARD_WIDTH < cardPoint.w - 12;
    const fitsLeft = cardPoint.x - CARD_GAP - CARD_WIDTH > 12;
    const routeOnRight = cardPoint.fromX != null && cardPoint.fromX > cardPoint.x;
    const right = routeOnRight ? fitsRight && !fitsLeft : fitsRight;
    const left = right ? cardPoint.x + CARD_GAP : Math.max(12, cardPoint.x - CARD_GAP - CARD_WIDTH);
    const top = Math.min(Math.max(12, cardPoint.y - 70), Math.max(12, cardPoint.h - 330));
    cardStyle = { left, top, width: CARD_WIDTH };
  }

  return (
    <div className={cn("tracking-map relative isolate overflow-hidden", className)} dir="ltr">
      <div ref={containerRef} className="absolute inset-0" />
      {card && cardStyle && (
        <div
          key={`${card.lat},${card.lng}`}
          dir="rtl"
          className="tk-card absolute z-[1000]"
          style={cardStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {card.content}
        </div>
      )}
      {children}
    </div>
  );
}
