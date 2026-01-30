"use client";

import dynamic from "next/dynamic";
import type { ResultItem } from "../types";

// Dynamic import to avoid SSR issues with Google Maps
const GoogleMapView = dynamic(() => import("../GoogleMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-muted-foreground text-sm">Loading map...</div>
      </div>
    </div>
  ),
});

type Props = {
  items: ResultItem[];
  activeId: string | null;
  hoveredId: string | null;
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
  fitBoundsKey: number;
};

export default function MapPanel({ items, activeId, hoveredId, onPick, onHover, fitBoundsKey }: Props) {
  return (
    <div className="h-full w-full">
      <GoogleMapView
        items={items}
        activeId={activeId}
        hoveredId={hoveredId}
        onMarkerClick={onPick}
        onMarkerHover={onHover}
        fitBoundsKey={fitBoundsKey}
      />
    </div>
  );
}
