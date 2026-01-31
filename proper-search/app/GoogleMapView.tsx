"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow } from "@react-google-maps/api";
import type { ResultItem } from "./types";

type Props = {
  items: ResultItem[];
  activeId: string | null;
  hoveredId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
  fitBoundsKey: number; // Only fit bounds when this changes (on explicit search)
};

const DEFAULT_CENTER = { lat: 25.7617, lng: -80.1918 }; // Miami
const DEFAULT_ZOOM = 11;

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Clean, modern map style
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatShortPrice(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default function GoogleMapView({ items, activeId, hoveredId, onMarkerClick, onMarkerHover, fitBoundsKey }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedItem, setSelectedItem] = useState<ResultItem | null>(null);
  const lastFitBoundsKey = useRef<number>(-1);

  // Store map reference
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fit bounds ONLY when fitBoundsKey changes (explicit search action)
  useEffect(() => {
    if (!mapRef.current || items.length === 0) return;
    if (fitBoundsKey === lastFitBoundsKey.current) return;

    lastFitBoundsKey.current = fitBoundsKey;

    const bounds = new google.maps.LatLngBounds();
    items.forEach((item) => {
      if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
        bounds.extend({ lat: item.lat, lng: item.lng });
      }
    });

    mapRef.current.fitBounds(bounds, 50);
  }, [items, fitBoundsKey]);

  // Pan to active marker
  useEffect(() => {
    if (!mapRef.current || !activeId) return;

    const activeItem = items.find((i) => i.id === activeId);
    if (!activeItem) return;

    mapRef.current.panTo({ lat: activeItem.lat, lng: activeItem.lng });
    const currentZoom = mapRef.current.getZoom() || DEFAULT_ZOOM;
    if (currentZoom < 13) {
      mapRef.current.setZoom(13);
    }

    setSelectedItem(activeItem);
  }, [activeId, items]);

  const handleMarkerClick = (item: ResultItem) => {
    setSelectedItem(item);
    onMarkerClick(item.id);
  };

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-xl">
        <div className="text-center text-destructive">
          <p className="font-medium">Failed to load Google Maps</p>
          <p className="text-sm text-muted-foreground mt-1">Please check your API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-xl">
        <div className="text-muted-foreground text-sm">Loading map...</div>
      </div>
    );
  }

  const center = items.length > 0 
    ? { lat: items[0].lat, lng: items[0].lng } 
    : DEFAULT_CENTER;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={DEFAULT_ZOOM}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {items.map((item) => {
        if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return null;

        const isActive = activeId === item.id || selectedItem?.id === item.id;
        const isHovered = hoveredId === item.id;
        const isHighlighted = isActive || isHovered;

        return (
          <OverlayView
            key={item.id}
            position={{ lat: item.lat, lng: item.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={() => handleMarkerClick(item)}
              onMouseEnter={() => onMarkerHover(item.id)}
              onMouseLeave={() => onMarkerHover(null)}
              className={`
                cursor-pointer transform -translate-x-1/2 -translate-y-full
                transition-all duration-150 hover:scale-105 hover:z-50
                ${isHighlighted ? "z-40 scale-105" : "z-10"}
              `}
            >
              <div
                className="px-3.5 py-2 rounded-full font-extrabold text-[13px] whitespace-nowrap shadow-md transition-all duration-150"
                style={{
                  backgroundColor: isActive ? "#dc2626" : "#16a34a",
                  color: "white",
                  minWidth: "52px",
                  textAlign: "center",
                  letterSpacing: "-0.01em",
                }}
              >
                {formatShortPrice(item.price)}
              </div>
              <div 
                className="w-0 h-0 mx-auto border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent transition-all duration-150"
                style={{
                  borderTopColor: isActive ? "#dc2626" : "#16a34a",
                  marginTop: "-1px",
                }}
              />
            </div>
          </OverlayView>
        );
      })}

      {selectedItem && (
        <InfoWindow
          position={{ lat: selectedItem.lat, lng: selectedItem.lng }}
          onCloseClick={() => setSelectedItem(null)}
          options={{
            pixelOffset: new google.maps.Size(0, -10),
          }}
        >
          <div className="min-w-[200px] p-1">
            <div className="font-semibold text-sm text-gray-900 mb-1">
              {selectedItem.address}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {selectedItem.city}, {selectedItem.state} {selectedItem.zip}
            </div>
            <div className="text-lg font-bold text-green-600 mb-2">
              {formatPrice(selectedItem.price)}
            </div>
            <div className="flex gap-3 text-xs text-gray-600 mb-3">
              <span>{selectedItem.beds} beds</span>
              <span>{selectedItem.baths} baths</span>
              <span>{selectedItem.sqft.toLocaleString()} sqft</span>
            </div>
            <button
              onClick={() => onMarkerClick(selectedItem.id)}
              className="w-full text-xs text-center py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              View Details
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
