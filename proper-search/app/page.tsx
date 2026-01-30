"use client";

import { useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import MapPanel from "./components/MapPanel";
import ResultsPanel from "./components/ResultsPanel";
import { mockItems } from "./data/mockItems";

import type { Filters, ResultItem } from "./types";

// ✅ IMPORTANT:
// Replace this with your real items source (the mock data you already had working).
// Example (if you had it before): import { items } from "./mockData";


const DEFAULT_FILTERS: Filters = {
  city: "",
  minBeds: "",
  maxPrice: "",
  flags: { absentee: false, highEquity: false, vacant: false },
} as any;

export default function Page() {
  // Draft (user typing/toggling)
  const [draftQuery, setDraftQuery] = useState("");
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Applied (drives map + results)
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Active + selection
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ✅ BOSS APPLY: copies draft -> applied
  const applySearch = () => {
    setAppliedQuery(draftQuery);
    setAppliedFilters(draftFilters);
    setActiveId(null);
    setSelectedIds([]);
  };

  // Filter ONLY uses applied state
  const filteredItems = useMemo(() => {
    const city = (appliedFilters as any)?.city?.trim?.().toLowerCase?.() ?? "";
    const minBedsRaw = (appliedFilters as any)?.minBeds ?? "";
    const maxPriceRaw = (appliedFilters as any)?.maxPrice ?? "";
    const flags =
      (appliedFilters as any)?.flags ?? {
        absentee: false,
        highEquity: false,
        vacant: false,
      };

    const minBeds = minBedsRaw === "" ? null : Number(minBedsRaw);
    const maxPrice = maxPriceRaw === "" ? null : Number(maxPriceRaw);
    const q = (appliedQuery || "").toLowerCase().trim();

    return (mockItems ?? []).filter((p: any) => {

      // city
      if (city) {
        const pCity = (p.city ?? p.City ?? "").toString().toLowerCase();
        if (!pCity.includes(city)) return false;
      }

      // beds
      if (minBeds !== null) {
        const beds = Number(p.beds ?? p.Beds ?? 0);
        if (Number.isFinite(minBeds) && beds < minBeds) return false;
      }

      // price
      if (maxPrice !== null) {
        const price = Number(p.price ?? p.Price ?? 0);
        if (Number.isFinite(maxPrice) && price > maxPrice) return false;
      }

      // quick flags (only filter if ON)
      if (flags.absentee) {
        const v = Boolean(p.absentee ?? p.Absentee);
        if (!v) return false;
      }
      if (flags.vacant) {
        const v = Boolean(p.vacant ?? p.Vacant);
        if (!v) return false;
      }
      if (flags.highEquity) {
        const eq = p.equity ?? p.Equity ?? 0;
        const eqNum =
          typeof eq === "string" ? Number(eq.replace("%", "")) : Number(eq);
        const isHigh =
          Boolean(p.highEquity ?? p.HighEquity) ||
          (Number.isFinite(eqNum) && eqNum >= 40);
        if (!isHigh) return false;
      }

      // query (address/city/state/zip)
      if (q) {
        const hay = [
          p.address,
          p.Address,
          p.city,
          p.City,
          p.state,
          p.State,
          p.zip,
          p.Zip,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [appliedFilters, appliedQuery]);

  // Results selection helpers (matching your ResultsPanel props)
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = filteredItems.map((x: any) => x.id).filter(Boolean);
    setSelectedIds(allIds);
  };

  const clearSelection = () => setSelectedIds([]);

  const pick = (id: string) => setActiveId(id);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar above everything */}
      <div className="relative z-30">
        <TopBar
          query={draftQuery}
          onQueryChange={setDraftQuery}
          onSearch={applySearch}
          onClear={() => setDraftQuery("")}
        />
      </div>

      {/* ✅ Z-INDEX FIX: side panels always clickable, map stays in middle */}
      <div className="grid grid-cols-[360px_1fr_360px] gap-4 p-4 relative">
        {/* LEFT */}
        <div className="relative z-20 pointer-events-auto">
          <Sidebar
            filters={draftFilters}
            onChange={setDraftFilters}
            onApply={applySearch}
          />
        </div>

        {/* MIDDLE */}
        <div className="relative z-0 overflow-hidden rounded-2xl">
          <MapPanel
            items={filteredItems}
            activeId={activeId}
            onMarkerClick={pick}
          />
        </div>

        {/* RIGHT */}
        <div className="relative z-20 pointer-events-auto">
          <ResultsPanel
            items={filteredItems}
            activeId={activeId}
            selectedIds={selectedIds}
            onPick={pick}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
          />
        </div>
      </div>
    </div>
  );
}
