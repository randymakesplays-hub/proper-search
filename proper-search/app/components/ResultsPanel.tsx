"use client";

import * as React from "react";
import type { ResultItem } from "./types";

type SelectedIds = Set<string> | string[] | undefined;

function isSelected(selectedIds: SelectedIds, id: string) {
  if (!selectedIds) return false;
  return Array.isArray(selectedIds) ? selectedIds.includes(id) : selectedIds.has(id);
}

function selectedCount(selectedIds: SelectedIds) {
  if (!selectedIds) return 0;
  return Array.isArray(selectedIds) ? selectedIds.length : selectedIds.size;
}

function formatMoney(n?: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function ResultsPanel(props: {
  items?: ResultItem[];
  activeId: string | null;
  selectedIds: SelectedIds;
  onPick: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}) {
  const items = props.items ?? [];
  const { activeId, selectedIds, onPick, onToggleSelect, onSelectAll, onClearSelection } = props;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-xs text-zinc-600">
          <span className="font-medium text-zinc-900">{items.length}</span> Results
          {selectedCount(selectedIds) > 0 && (
            <span className="ml-2 text-zinc-500">
              ({selectedCount(selectedIds)} selected)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-md border px-2 py-1 text-xs"
            onClick={onSelectAll}
            type="button"
          >
            Select All
          </button>
          <button
            className="rounded-md border px-2 py-1 text-xs"
            onClick={onClearSelection}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-2 space-y-2">
        {items.map((it: any) => {
          const active = activeId === it.id;
          const checked = isSelected(selectedIds, it.id);

          return (
            <div
              key={it.id}
              className={[
                "rounded-xl border p-3 cursor-pointer",
                active ? "ring-2 ring-zinc-900/20" : "",
              ].join(" ")}
              onClick={() => onPick(it.id)}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSelect(it.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />

                <div className="flex-1">
                  <div className="font-semibold text-sm">{formatMoney(it.price)}</div>
                  <div className="text-xs text-zinc-700">{it.address}</div>
                  <div className="text-xs text-zinc-500">
                    {it.city}, {it.state} {it.zip}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-700">
                      {it.beds ?? 0} beds
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-700">
                      {it.baths ?? 0} baths
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-700">
                      {it.sqft ?? 0} sqft
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] text-emerald-800">
                      {it.equityPct ?? 0}% equity
                    </span>

                    {(it.tags ?? []).slice(0, 3).map((t: string, idx: number) => (
                      <span
                        key={`${it.id}-${t}-${idx}`}
                        className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="p-3 text-sm text-zinc-500">No results. Try loosening filters.</div>
        )}
      </div>
    </div>
  );
}
