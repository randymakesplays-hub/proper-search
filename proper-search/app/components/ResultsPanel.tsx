"use client";

import type { ResultItem } from "../types";

type Props = {
  items: ResultItem[];
  activeId: string | null;
  selectedIds: string[];
  onPick: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

export default function ResultsPanel({
  items,
  activeId,
  selectedIds,
  onPick,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
}: Props) {
  return (
    <div className="h-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-zinc-200">
          Results ({items.length})
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="h-8 px-3 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-900"
          >
            Select All
          </button>
          <button
            onClick={onClearSelection}
            className="h-8 px-3 rounded-lg border border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-900"
          >
            Clear
          </button>
        </div>
      </div>

      {/* DEBUG – DO NOT REMOVE YET */}
      <div className="text-xs text-red-400 mb-3">
        DEBUG → first city: {items?.[0]?.city ?? "NONE"} | price:{" "}
        {items?.[0]?.price ?? "NONE"}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-sm text-zinc-400">
          No results. Click <b>Apply</b>.
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          const active = activeId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onPick(item.id)}
              className={[
                "rounded-xl border p-3 cursor-pointer transition",
                active
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-800 hover:bg-zinc-900",
              ].join(" ")}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {item.address}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {item.city}, {item.state} {item.zip}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(item.id);
                  }}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Pill label={`$${item.price.toLocaleString()}`} />
                <Pill label={`${item.beds} beds`} />
                <Pill label={`${item.baths} baths`} />
                <Pill label={`${item.sqft} sqft`} />
                {item.equityPct != null && (
                  <Pill
                    label={`${item.equityPct}% equity`}
                    accent
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pill({
  label,
  accent,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 border text-xs font-medium",
        accent
          ? "bg-emerald-100 text-emerald-900 border-emerald-200"
          : "bg-zinc-900 text-zinc-200 border-zinc-700",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
