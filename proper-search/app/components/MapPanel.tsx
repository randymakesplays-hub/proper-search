"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ResultItem } from "../types";

const MapView = dynamic(() => import("../MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl border bg-white flex items-center justify-center text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});
const AnyMapView = MapView as any;

type Focus = {
  lat: number;
  lng: number;
} | null;

export default function MapPanel({
  items,
  activeId,
  onMarkerClick,
}: {
  items: ResultItem[];
  activeId: string | null;
  onMarkerClick: (id: string) => void;
}) {
  const focus: Focus = useMemo(() => {
    if (!activeId) return null;
    const found = items.find((i) => i.id === activeId);
    if (!found) return null;
    return { lat: found.lat, lng: found.lng };
  }, [activeId, items]);

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border bg-white">
      <AnyMapView
  items={items}
  activeId={activeId}
  focus={focus}
  onMarkerClick={onMarkerClick}
      />
    </div>
  );
}
