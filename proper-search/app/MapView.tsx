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
  onMarkerClick: (id: string) => void;
};

const DEFAULT_CENTER: [number, number] = [25.7617, -80.1918]; // Miami
const DEFAULT_ZOOM = 11;

// Custom marker icon
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
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Fits bounds when the set of items changes */
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
function FlyToActive({ active }: { active: ResultItem | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    const pos = toLatLng(active);
    if (!pos) return;

    map.flyTo(pos, Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [map, active]);

  return null;
}

export default function MapView({ items, activeId, onMarkerClick }: Props) {
  const boundsKey = items.map((i) => i.id).join("|");
  const active = activeId ? items.find((i) => i.id === activeId) : undefined;

  const firstPos = items.length > 0 ? toLatLng(items[0]) : null;
  const initialCenter = firstPos ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />

      <FitToItems items={items} boundsKey={boundsKey} />
      <FlyToActive active={active} />

      {items.map((item) => {
        const pos = toLatLng(item);
        if (!pos) return null;

        return (
          <Marker
            key={item.id}
            position={pos}
            icon={markerIcon}
            eventHandlers={{
              click: () => onMarkerClick(item.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold text-sm mb-1">{item.address}</div>
                <div className="text-xs text-gray-600 mb-2">
                  {item.city}, {item.state} {item.zip}
                </div>
                <div className="text-base font-bold text-green-600 mb-2">
                  {formatPrice(item.price)}
                </div>
                <div className="flex gap-3 text-xs text-gray-600 mb-2">
                  <span>{item.beds} beds</span>
                  <span>{item.baths} baths</span>
                  <span>{item.sqft.toLocaleString()} sqft</span>
                </div>
                <button
                  onClick={() => onMarkerClick(item.id)}
                  className="w-full text-xs text-center py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
