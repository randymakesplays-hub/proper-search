"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
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

// Custom marker icon using your /public files
const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function toLatLng(item: ResultItem): [number, number] | null {
  const lat = Number((item as any).lat);
  const lng = Number((item as any).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

/** Fits bounds ONLY when the set of items changes (not every click). */
function FitToItems({ items, boundsKey }: { items: ResultItem[]; boundsKey: string }) {
  const map = useMap();

  useEffect(() => {
    if (!items || items.length === 0) return;

    const pts = items
      .map((p) => toLatLng(p))
      .filter((p): p is [number, number] => p !== null);

    if (pts.length === 0) return;

    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, boundsKey, items]);

  return null;
}

/** Fly to active pin when active changes */
function FlyToActive({ active }: { active?: ResultItem }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    const pos = toLatLng(active);
    if (!pos) return;

    map.flyTo(pos, Math.max(map.getZoom(), 12), { duration: 0.6 });
  }, [map, active]);

  return null;
}

export default function MapView({ items, activeId, onMarkerClick }: Props) {
  const boundsKey = (items ?? []).map((i: any) => i.id).join("|");

  const active = activeId ? (items ?? []).find((i: any) => i.id === activeId) : undefined;

  const firstPos = items && items.length > 0 ? toLatLng(items[0]) : null;
  const initialCenter = firstPos ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />

      <FitToItems items={items} boundsKey={boundsKey} />
      <FlyToActive active={active as any} />

      {(items ?? []).map((p: any) => {
        const pos = toLatLng(p);
        if (!pos) return null;

        return (
          <Marker
            key={p.id ?? `${pos[0]}-${pos[1]}`}
            position={pos}
            icon={markerIcon}
            eventHandlers={{
              click: () => onMarkerClick(p.id),
            }}
          >
            <Popup>
              <div style={{ fontSize: 12 }}>
                <div>
                  <b>ID:</b> {p.id}
                </div>
                <div>
                  <b>Lat:</b> {String(p.lat)}
                </div>
                <div>
                  <b>Lng:</b> {String(p.lng)}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
