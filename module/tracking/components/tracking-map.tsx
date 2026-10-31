"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { cn } from "@/lib/utils";
import type { LatLng, PlannedCustomer, TrackPoint } from "../types";

export interface MapTrack {
  id: string;
  color: string;
  path: TrackPoint[];
  position: TrackPoint | null;
  /** Shown as a name chip on the position marker (all-reps view). */
  label?: string;
  /** Pulsing position marker — the rep is out in the field right now. */
  live?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
}

export interface MapStop {
  id: string;
  lat: number;
  lng: number;
  /** Text inside the pin, e.g. the visit number. */
  badge: string;
  color: string;
  tooltip: string;
  dimmed?: boolean;
}

interface TrackingMapProps {
  center: LatLng;
  tracks: MapTrack[];
  stops?: MapStop[];
  planned?: PlannedCustomer[];
  depot?: LatLng | null;
  selectedStopId?: string | null;
  onStopClick?: (id: string) => void;
  onTrackClick?: (id: string) => void;
  /** Bounds are refitted whenever this changes (new rep, new day…), not on every redraw. */
  fitKey: string;
  /** Fly here whenever `key` changes. */
  focus?: { lat: number; lng: number; key: number } | null;
  className?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const truckHtml = (color: string, live: boolean) => `
  <div class="tm-truck${live ? " tm-truck--live" : ""}" style="--c:${color}">
    <span class="tm-truck__pulse"></span>
    <span class="tm-truck__body">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2" />
        <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    </span>
  </div>`;

const repChipHtml = (color: string, label: string, live: boolean, highlighted: boolean) => `
  <div class="tm-rep${live ? " tm-rep--live" : ""}${highlighted ? " tm-rep--active" : ""}" style="--c:${color}">
    <span class="tm-rep__label">${escapeHtml(label)}</span>
    <span class="tm-rep__dot"><span class="tm-truck__pulse"></span></span>
  </div>`;

export function TrackingMap({
  center,
  tracks,
  stops = [],
  planned = [],
  depot,
  selectedStopId,
  onStopClick,
  onTrackClick,
  fitKey,
  focus,
  className,
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onStopClick, onTrackClick });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onStopClick, onTrackClick };
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
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 90,
      });
      L.control.zoom({ position: "topleft" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: "abc",
        attribution: "© OpenStreetMap contributors",
        keepBuffer: 4,
      }).addTo(map);

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

    planned.forEach((c) => {
      L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          html: `<div class="tm-planned"><span class="tm-planned__dot"></span><span class="tm-planned__label">${escapeHtml(c.name)}</span></div>`,
          className: "",
          iconSize: [0, 0],
        }),
        zIndexOffset: -100,
      })
        .bindTooltip(`${escapeHtml(c.name)}<br/><small>لم تتم زيارته</small>`, { direction: "top", offset: [0, -8] })
        .addTo(layer);
    });

    if (depot) {
      L.marker(depot, {
        icon: L.divIcon({
          html: `<div class="tm-depot">م</div>`,
          className: "",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      })
        .bindTooltip("المستودع", { direction: "top", offset: [0, -12] })
        .addTo(layer);
    }

    tracks.forEach((track) => {
      if (track.path.length > 1) {
        const latlngs = track.path.map((p) => [p.lat, p.lng] as LatLng);
        // White casing under the colored line keeps it readable over the tiles.
        L.polyline(latlngs, {
          color: "#fff",
          weight: track.highlighted ? 9 : 7,
          opacity: track.dimmed ? 0.25 : 0.9,
          interactive: false,
        }).addTo(layer);
        const line = L.polyline(latlngs, {
          color: track.color,
          weight: track.highlighted ? 5 : 4,
          opacity: track.dimmed ? 0.25 : 0.95,
        }).addTo(layer);
        if (onTrackClick) line.on("click", () => callbacksRef.current.onTrackClick?.(track.id));
      }
    });

    stops.forEach((stop) => {
      const selected = stop.id === selectedStopId;
      L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({
          html: `<div class="tm-stop${selected ? " tm-stop--active" : ""}${stop.dimmed ? " tm-stop--dim" : ""}" style="--c:${stop.color}">${escapeHtml(stop.badge)}</div>`,
          className: "",
          iconSize: [0, 0],
        }),
        zIndexOffset: selected ? 900 : 100,
      })
        .bindTooltip(stop.tooltip, { direction: "top", offset: [0, -14] })
        .on("click", () => callbacksRef.current.onStopClick?.(stop.id))
        .addTo(layer);
    });

    tracks.forEach((track) => {
      if (!track.position) return;
      const html = track.label
        ? repChipHtml(track.color, track.label, !!track.live, !!track.highlighted)
        : truckHtml(track.color, !!track.live);
      L.marker([track.position.lat, track.position.lng], {
        icon: L.divIcon({ html, className: "", iconSize: [0, 0] }),
        zIndexOffset: track.highlighted ? 2000 : 1500,
        opacity: track.dimmed ? 0.45 : 1,
      })
        .on("click", () => callbacksRef.current.onTrackClick?.(track.id))
        .addTo(layer);
    });

    if (fittedKeyRef.current !== fitKey) {
      const points: LatLng[] = [
        ...tracks.flatMap((t) => t.path.map((p) => [p.lat, p.lng] as LatLng)),
        ...tracks.flatMap((t) => (t.position ? [[t.position.lat, t.position.lng] as LatLng] : [])),
        ...planned.map((c) => [c.lat, c.lng] as LatLng),
      ];
      if (points.length) {
        fittedKeyRef.current = fitKey;
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16, animate: false });
      }
    }
  }, [ready, tracks, stops, planned, depot, selectedStopId, fitKey, onTrackClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
    // Re-fly on every request, even to the same point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focus?.key]);

  return (
    <div className={cn("tracking-map relative isolate overflow-hidden", className)} dir="ltr">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
