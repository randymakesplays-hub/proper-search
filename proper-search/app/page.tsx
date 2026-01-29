"use client";

import * as React from "react";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import MapPanel from "./components/MapPanel";
import ResultsPanel from "./components/ResultsPanel";
import FooterBar from "./components/FooterBar";
import PropertyDrawer from "./components/PropertyDrawer";

import type { ResultItem } from "./types";

type FiltersLike = {
  city: string;
  minBeds?: number | "";
  maxPrice?: number | "";
  flags: {
    absentee: boolean;
    highEquity: boolean;
    vacant: boolean;
  };
};

const DEFAULT_FILTERS: FiltersLike = {
  city: "Houston",
  minBeds: "",
  maxPrice: "",
  flags: { absentee: false, highEquity: false, vacant: false },
};

type SavedSearch = {
  id: string;
  name: string;
  createdAt: number;
  query: string;
  filters: FiltersLike;
};

const SAVED_SEARCHES_KEY = "propersearch_saved_searches_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  return safeParse<SavedSearch[]>(window.localStorage.getItem(SAVED_SEARCHES_KEY), []);
}

function persistSavedSearches(items: SavedSearch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(items));
}

function uid() {
  // good enough for localStorage
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHoustonMock(count: number): ResultItem[] {
  const baseLat = 29.7604;
  const baseLng = -95.3698;

  const streets = [
    "Bellaire St",
    "Almeda St",
    "Main St",
    "Westheimer Rd",
    "Kirby Dr",
    "Richmond Ave",
    "Montrose Blvd",
    "Washington Ave",
    "Fannin St",
    "Gulfton St",
  ];

  const out: ResultItem[] = [];

  for (let i = 0; i < count; i++) {
    const beds = randInt(2, 6);
    const baths = randInt(1, 4);
    const sqft = randInt(900, 3200);
    const price = randInt(65000, 400000);
    const equity = randInt(5, 55);
    const isAbsentee = Math.random() < 0.35;
    const isVacant = Math.random() < 0.18;
    const isHighEquity = equity >= 30;

    const lat = baseLat + (Math.random() - 0.5) * 0.7;
    const lng = baseLng + (Math.random() - 0.5) * 0.7;

    const street = streets[randInt(0, streets.length - 1)];
    const houseNum = randInt(100, 9999);
    const zip = `${randInt(77001, 77999)}`;

    out.push({
      id: `prop_${i + 1}`,
      price,
      address: `${houseNum} ${street}`,
      city: "Houston",
      state: "TX",
      zip,
      beds,
      baths,
      sqft,
      equityPct: equity,
      tags: [
        ...(isAbsentee ? ["Absentee"] : []),
        ...(isVacant ? ["Vacant"] : []),
        ...(isHighEquity ? ["High Equity"] : []),
      ],
      lat,
      lng,
    } as any);
  }

  return out;
}

function applyFilters(items: ResultItem[], query: string, f: FiltersLike) {
  let out = items;

  // flags
  if (f.flags.absentee) out = out.filter((it: any) => (it.tags ?? []).includes("Absentee"));
  if (f.flags.highEquity) out = out.filter((it: any) => (it.tags ?? []).includes("High Equity"));
  if (f.flags.vacant) out = out.filter((it: any) => (it.tags ?? []).includes("Vacant"));

  // numeric filters
  const minBeds = f.minBeds;
  if (typeof minBeds === "number") {
    out = out.filter((it: any) => (it.beds ?? 0) >= minBeds);
  }

  const maxPrice = f.maxPrice;
  if (typeof maxPrice === "number") {
    out = out.filter((it: any) => (it.price ?? 0) <= maxPrice);
  }

  // query
  const q = (query ?? "").trim().toLowerCase();
  if (q) {
    out = out.filter((it: any) => {
      const hay = `${it.address ?? ""} ${it.city ?? ""} ${it.state ?? ""} ${it.zip ?? ""} ${(it.tags ?? []).join(" ")}`
        .toLowerCase();
      return hay.includes(q);
    });
  }

  // city
  const city = (f.city ?? "").trim().toLowerCase();
  if (city) out = out.filter((it: any) => (it.city ?? "").toLowerCase().includes(city));

  return out;
}

export default function Page() {
  // core state
  const [query, setQuery] = React.useState("");
  const [allItems, setAllItems] = React.useState<ResultItem[]>([]);
  const [filtered, setFiltered] = React.useState<ResultItem[]>([]);
  const [filtersDraft, setFiltersDraft] = React.useState<FiltersLike>(DEFAULT_FILTERS);
  const [filtersApplied, setFiltersApplied] = React.useState<FiltersLike>(DEFAULT_FILTERS);

  // selection + active
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // saved searches
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([]);
  const [saveName, setSaveName] = React.useState("");
  const [selectedSavedId, setSelectedSavedId] = React.useState<string>("");

  React.useEffect(() => {
    const data = generateHoustonMock(400);
    setAllItems(data);
    setFiltered(data);

    // load saved searches from localStorage
    const saved = loadSavedSearches();
    setSavedSearches(saved);
    if (saved.length) setSelectedSavedId(saved[0].id);
  }, []);

  const activeItem = React.useMemo(() => {
    if (!activeId) return null;
    return allItems.find((x: any) => x.id === activeId) ?? null;
  }, [activeId, allItems]);

  const runSearch = React.useCallback(() => {
    const next = applyFilters(allItems, query, filtersApplied);
    setFiltered(next);
    setSelectedIds(new Set());
    if (activeId && !next.some((x: any) => x.id === activeId)) setActiveId(null);
  }, [allItems, query, filtersApplied, activeId]);

  const clearSearch = React.useCallback(() => {
    setQuery("");
    setFiltersDraft(DEFAULT_FILTERS);
    setFiltersApplied(DEFAULT_FILTERS);
    setFiltered(allItems);
    setSelectedIds(new Set());
    setActiveId(null);
  }, [allItems]);

  const onApplyFilters = React.useCallback(() => {
    const safeDraft: FiltersLike = {
      ...filtersDraft,
      flags: {
        absentee: !!filtersDraft.flags?.absentee,
        highEquity: !!filtersDraft.flags?.highEquity,
        vacant: !!filtersDraft.flags?.vacant,
      },
      minBeds:
        filtersDraft.minBeds === ""
          ? ""
          : Number.isFinite(Number(filtersDraft.minBeds))
            ? Number(filtersDraft.minBeds)
            : "",
      maxPrice:
        filtersDraft.maxPrice === ""
          ? ""
          : Number.isFinite(Number(filtersDraft.maxPrice))
            ? Number(filtersDraft.maxPrice)
            : "",
    };

    setFiltersApplied(safeDraft);
    const next = applyFilters(allItems, query, safeDraft);
    setFiltered(next);
    setSelectedIds(new Set());
    if (activeId && !next.some((x: any) => x.id === activeId)) setActiveId(null);
  }, [filtersDraft, allItems, query, activeId]);

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds(new Set(filtered.map((x: any) => x.id)));
  }, [filtered]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Saved Searches actions
  const saveCurrentSearch = React.useCallback(() => {
    const name =
      saveName.trim() ||
      `Search ${new Date().toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
  
    const newItem: SavedSearch = {
      id: uid(),
      name,
      createdAt: Date.now(),
      query,
      filters: filtersApplied,
    };
  
    const existingById = selectedSavedId
      ? savedSearches.find((s) => s.id === selectedSavedId)
      : null;
      React.useEffect(() => {
        const lastId = localStorage.getItem("properSearch:lastSavedId");
        if (!lastId) return;
        setSelectedSavedId(lastId);
      }, []);
      
    const existingByName = savedSearches.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
  
    let next: SavedSearch[];
  
    if (existingById) {
      next = savedSearches.map((s) =>
        s.id === existingById.id
          ? { ...newItem, id: existingById.id, createdAt: s.createdAt }
          : s
      );
      setSelectedSavedId(existingById.id);
    } else if (existingByName) {
      next = savedSearches.map((s) =>
        s.id === existingByName.id
          ? { ...newItem, id: existingByName.id, createdAt: s.createdAt }
          : s
      );
      setSelectedSavedId(existingByName.id);
    } else {
      next = [newItem, ...savedSearches];
      setSelectedSavedId(newItem.id);
    }
  
    setSavedSearches(next);
    persistSavedSearches(next);
    localStorage.setItem(
      "properSearch:lastSavedId",
      selectedSavedId ?? newItem.id
    );
    setSaveName("");
  }, [
    saveName,
    query,
    filtersApplied,
    savedSearches,
    selectedSavedId,
    persistSavedSearches,
  ]);
  

  

    

  const loadSelectedSearch = React.useCallback(() => {
    const found = savedSearches.find((s) => s.id === selectedSavedId);
    if (!found) return;

    setQuery(found.query ?? "");
    setFiltersDraft(found.filters);
    setFiltersApplied(found.filters);

    const next = applyFilters(allItems, found.query ?? "", found.filters);
    setFiltered(next);
    setSelectedIds(new Set());
    setActiveId(null);
  }, [savedSearches, selectedSavedId, allItems]);

  const deleteSelectedSearch = React.useCallback(() => {
    if (!selectedSavedId) return;
    const next = savedSearches.filter((s) => s.id !== selectedSavedId);
    setSavedSearches(next);
    persistSavedSearches(next);

    const nextSelected = next[0]?.id ?? "";
    setSelectedSavedId(nextSelected);
  }, [savedSearches, selectedSavedId]);

  // Cast components to any to avoid prop-name TS friction while you iterate fast
  const AnyTopBar: any = TopBar;
  const AnySidebar: any = Sidebar;
  const AnyMapPanel: any = MapPanel;
  const AnyResultsPanel: any = ResultsPanel;
  const AnyFooterBar: any = FooterBar;
  const AnyPropertyDrawer: any = PropertyDrawer;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar stays fixed */}
      <div className="sticky top-0 z-50 bg-white border-b">
      <AnyTopBar
  query={query}
  onQueryChange={setQuery}
  onRunSearch={runSearch}
  onClear={clearSearch}
/>


        {/* Saved Searches bar */}
        <div className="px-4 py-3 border-t bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Saved Searches</div>

            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name this search…"
              className="h-9 w-[220px] rounded-lg border px-3 text-sm"
            />

            <button
              onClick={saveCurrentSearch}
              className="h-9 px-3 rounded-lg border text-sm font-medium hover:bg-slate-50"
            >
              Save current
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            <select
              value={selectedSavedId}
              onChange={(e) => setSelectedSavedId(e.target.value)}
              className="h-9 w-[260px] rounded-lg border px-3 text-sm"
            >
              <option value="" disabled>
                {savedSearches.length ? "Select a saved search…" : "No saved searches yet"}
              </option>
              {savedSearches.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadSelectedSearch}
              disabled={!selectedSavedId}
              className="h-9 px-3 rounded-lg border text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Load
            </button>

            <button
              onClick={deleteSelectedSearch}
              disabled={!selectedSavedId}
              className="h-9 px-3 rounded-lg border text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          {/* Tiny helper text */}
          <div className="mt-2 text-xs text-slate-500">
            Saves query + filters to your browser (localStorage). Later we’ll move this to user accounts.
          </div>
        </div>
      </div>

      {/* Middle section takes remaining height and does NOT page-scroll */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-[280px_1fr_380px]">
          {/* LEFT */}
          <aside className="h-full overflow-hidden border-r">
            <AnySidebar draft={filtersDraft} setDraft={setFiltersDraft} onApply={onApplyFilters} />
          </aside>

          {/* CENTER */}
          <section className="h-full overflow-hidden">
            <AnyMapPanel items={filtered as any} activeId={activeId} onMarkerClick={(id: string) => setActiveId(id)} />
          </section>

          {/* RIGHT (scrolls inside only) */}
          <aside className="h-full overflow-hidden border-l">
            <div className="h-full overflow-y-auto">
              <AnyResultsPanel
                items={filtered}
                activeId={activeId}
                setActiveId={setActiveId}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onClearSelection={clearSelection}
                onPick={(id: string) => setActiveId(id)}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer pinned */}
      <div className="border-t bg-white">
        <AnyFooterBar />
      </div>

      {/* Drawer */}
      {activeItem && <AnyPropertyDrawer item={activeItem} onClose={() => setActiveId(null)} />}
    </div>
  );
}
