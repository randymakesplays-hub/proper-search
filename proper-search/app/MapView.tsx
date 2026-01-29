"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { ResultItem } from "./types";

type Props = {
  items: ResultItem[];
  activeId: string | null;
  focus?: { lat: number; lng: number } | null;
  onMarkerClick: (id: string) => void;
};


const DEFAULT_CENTER: [number, number] = [29.7604, -95.3698]; // Houston
const DEFAULT_ZOOM = 10;

// Uses the images you already have in /public:
// /marker-icon.png, /marker-icon-2x.png, /marker-shadow.png
const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function toLatLng(item: ResultItem): [number, number] {
  return [Number(item.lat), Number(item.lng)];
}

/**
 * Fit bounds ONLY when the set of items changes (filters/search),
 * NOT when activeId changes (clicking a pin/property).
 */
function FitToItems({ items, boundsKey }: { items: ResultItem[]; boundsKey: string }) {
  const map = useMap();

  useEffect(() => {
    if (!items || items.length === 0) return;

    const pts = items
      .map((p) => toLatLng(p))
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

    if (pts.length === 0) return;

    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds, { padding: [40, 40] });

    // prevents “scrambled/gray tiles” after layout changes
    requestAnimationFrame(() => map.invalidateSize());
  }, [boundsKey, map]);

  return null;
}

/**
 * When you click a pin/property, smoothly center to that property
 * (and DO NOT refit bounds).
 */
function FlyToActive({ active }: { active?: ResultItem }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    const [lat, lng] = toLatLng(active);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const nextZoom = Math.max(map.getZoom(), 13);
    map.flyTo([lat, lng], nextZoom, { duration: 0.6 });

    requestAnimationFrame(() => map.invalidateSize());
  }, [active?.id, map]);

  return null;
}
function PanToFocus({ focus }: { focus?: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;
    map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 13), { animate: true });
  }, [focus, map]);

  return null;
}

export default function MapView({ items, activeId, onMarkerClick }: Props) {
  // This stays the same value even if React gives you a new array reference.
  // We use it so FitToItems does NOT re-run on every click.
  const boundsKey = items.map((i) => i.id).join("|");

  const active = activeId ? items.find((i) => i.id === activeId) : undefined;

  const initialCenter: [number, number] =
    items.length > 0 ? toLatLng(items[0]) : DEFAULT_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      {/* Use CARTO tiles (more reliable than hitting OSM’s access limits) */}
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />
<PanToFocus focus={active ? { lat: active.lat, lng: active.lng } : null} />

      <FitToItems items={items} boundsKey={boundsKey} />
      <FlyToActive active={active} />

      {items.map((p) => (
        <Marker
          key={p.id}
          position={toLatLng(p)}
          icon={markerIcon}
          eventHandlers={{
            click: () => onMarkerClick(p.id),
          }}
        >
          <Popup>
            <div style={{ fontSize: 12 }}>
              <div><b>ID:</b> {p.id}</div>
              <div><b>Lat:</b> {p.lat}</div>
              <div><b>Lng:</b> {p.lng}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
