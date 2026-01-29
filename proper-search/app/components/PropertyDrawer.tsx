"use client";

import React from "react";

type ResultItem = {
  id: string;

  price: number;
  address: string;
  city: string;
  state: string;
  zip: string;

  beds: number;
  baths: number;
  sqft: number;

  lat: number;
  lng: number;

  equityPct: number;
  tags: string[];
};

function formatMoney(n: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n ?? 0);
  } catch {
    return `$${Math.round(n ?? 0)}`;
  }
}

export default function PropertyDrawer({
  item,
  onClose,
}: {
  item: ResultItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const equity = Math.max(0, Math.min(100, Number(item.equityPct ?? 0)));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const fullAddress = `${item.address}, ${item.city}, ${item.state} ${item.zip}`;
  const coords = `${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)}`;

  return (
    <div className="fixed right-0 top-0 h-screen w-[380px] bg-white border-l shadow-xl z-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">Property</div>
            <div className="text-lg font-semibold text-slate-900 leading-tight">
              {item.address}
            </div>
            <div className="text-sm text-slate-600">
              {item.city}, {item.state} {item.zip}
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 px-3 py-2 rounded-lg border text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {/* Price */}
        <div className="mt-3">
          <div className="text-xs text-slate-500">Price</div>
          <div className="text-2xl font-semibold text-slate-900">
            {formatMoney(item.price)}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => copy(fullAddress)}
            className="px-3 py-2 rounded-lg border text-sm font-medium hover:bg-slate-50"
          >
            Copy Address
          </button>
          <button
            onClick={() => copy(coords)}
            className="px-3 py-2 rounded-lg border text-sm font-medium hover:bg-slate-50"
          >
            Copy Coords
          </button>
          <button
            onClick={() => {
              const rows = [
                ["id", item.id],
                ["price", String(item.price)],
                ["address", item.address],
                ["city", item.city],
                ["state", item.state],
                ["zip", item.zip],
                ["beds", String(item.beds)],
                ["baths", String(item.baths)],
                ["sqft", String(item.sqft)],
                ["equityPct", String(equity)],
                ["lat", String(item.lat)],
                ["lng", String(item.lng)],
                ["tags", (item.tags ?? []).join("|")],
              ];

              const csv = rows
                .map(([k, v]) => `${k},${JSON.stringify(v ?? "")}`)
                .join("\n");

              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `property_${item.id}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg border text-sm font-medium hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">Beds</div>
            <div className="text-lg font-semibold text-slate-900">
              {item.beds}
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">Baths</div>
            <div className="text-lg font-semibold text-slate-900">
              {item.baths}
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">Sqft</div>
            <div className="text-lg font-semibold text-slate-900">
              {item.sqft}
            </div>
          </div>
        </div>

        {/* Equity */}
        <div className="rounded-xl border p-3">
          <div className="text-xs text-slate-500">Equity</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-slate-900">{equity}%</div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-green-600"
                style={{ width: `${equity}%` }}
              />
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="rounded-xl border p-3">
          <div className="text-xs text-slate-500">Coordinates</div>
          <div className="mt-1 text-sm font-medium text-slate-900">{coords}</div>
        </div>

        {/* Tags */}
        <div className="rounded-xl border p-3">
          <div className="text-xs text-slate-500">Tags</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(item.tags ?? []).length === 0 ? (
              <span className="text-sm text-slate-500">None</span>
            ) : (
              item.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border"
                >
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
