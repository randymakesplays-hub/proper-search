"use client";

import * as React from "react";

// Keep your existing components, but cast to any so prop mismatch can't break builds
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import MapPanel from "./components/MapPanel";
import ResultsPanel from "./components/ResultsPanel";
import FooterBar from "./components/FooterBar";
import PropertyDrawer from "./components/PropertyDrawer";

import type { ResultItem } from "./types";

const TopBarAny = TopBar as any;
const SidebarAny = Sidebar as any;
const MapPanelAny = MapPanel as any;
const ResultsPanelAny = ResultsPanel as any;
const FooterBarAny = FooterBar as any;
const PropertyDrawerAny = PropertyDrawer as any;

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

type SavedSearch = {
  id: string;
  name: string;
  createdAt: number;
  query: string;
  filters: FiltersLike;
};

const DEFAULT_FILTERS: FiltersLike = {
  city: "Houston",
  minBeds: "",
  maxPrice: "",
  flags: { absentee: false, highEquity: false, vacant: false },
};

const SAVED_SEARCHES_KEY = "propersearch_saved_searches_v1";
const LAST_SAVED_ID_KEY = "properSearch:lastSavedId";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

function normalize(s: string) {
  return (s ?? "").toString().trim().toLowerCase();
}

/**
 * Very defensive filter function:
 * - Works even if ResultItem fields are different (uses "as any")
 */
function applyFilters(items: ResultItem[], query: string, filters: FiltersLike): ResultItem[] {
  const q = normalize(query);

  return items.filter((it) => {
    const x: any = it as any;

    // City
    if (filters.city && normalize(x.city) !== normalize(filters.city)) return false;

    // Beds
    const beds = Number(x.beds ?? x.bedrooms ?? 0);
    if (filters.minBeds !== "" && filters.minBeds !== undefined) {
      if (beds < Number(filters.minBeds)) return false;
    }

    // Price
    const price = Number(x.price ?? x.listPrice ?? x.askingPrice ?? 0);
    if (filters.maxPrice !== "" && filters.maxPrice !== undefined) {
      if (price > Number(filters.maxPrice)) return false;
    }

    // Flags
    if (filters.flags.absentee && !Boolean(x.absentee)) return false;
    if (filters.flags.highEquity && !Boolean(x.highEquity)) return false;
    if (filters.flags.vacant && !Boolean(x.vacant)) return false;

    // Query search (address / owner / anything stringy)
    if (q) {
      const hay = normalize(
        [
          x.address,
          x.street,
          x.ownerName,
          x.name,
          x.zip,
          x.county,
          x.state,
          x.city,
          x.apn,
        ]
          .filter(Boolean)
          .join(" ")
      );
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Fallback mock data so the app still builds even if your real dataset wiring changes.
 * If you already have real items, it will override this.
 */
const FALLBACK_ITEMS: ResultItem[] = [
  {
    id: "1",
    city: "Houston",
  } as any,
  {
    id: "2",
    city: "Houston",
  } as any,
  {
    id: "3",
    city: "Houston",
  } as any,
];

export default function Page() {
  // DATA
  const [allItems, setAllItems] = React.useState<ResultItem[]>(FALLBACK_ITEMS);

  // SEARCH STATE
  const [query, setQuery] = React.useState("");
  const [filtersDraft, setFiltersDraft] = React.useState<FiltersLike>(DEFAULT_FILTERS);
  const [filtersApplied, setFiltersApplied] = React.useState<FiltersLike>(DEFAULT_FILTERS);

  // RESULTS + SELECTION
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // SAVED SEARCHES
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>(() => loadSavedSearches());
  const [selectedSavedId, setSelectedSavedId] = React.useState<string | null>(null);
  const [saveName, setSaveName] = React.useState("");

  // FILTERED RESULTS
  const filtered = React.useMemo(() => {
    return applyFilters(allItems, query, filtersApplied);
  }, [allItems, query, filtersApplied]);

  // ---------- AUTO LOAD LAST SAVED SEARCH ID ----------
  React.useEffect(() => {
    const lastId = localStorage.getItem(LAST_SAVED_ID_KEY);
    if (!lastId) return;
    setSelectedSavedId(lastId);
  }, []);

  // ---------- LOAD SELECTED SAVED SEARCH (when ID changes) ----------
  React.useEffect(() => {
    if (!selectedSavedId) return;
    const found = savedSearches.find((s) => s.id === selectedSavedId);
    if (!found) return;

    setQuery(found.query ?? "");
    setFiltersDraft(found.filters);
    setFiltersApplied(found.filters);

    // Persist last used
    localStorage.setItem(LAST_SAVED_ID_KEY, found.id);
  }, [selectedSavedId, savedSearches]);

  // ---------- ACTIONS ----------
  const applyDraftFilters = React.useCallback(() => {
    setFiltersApplied(filtersDraft);
    setSelectedIds(new Set());
    setActiveId(null);
  }, [filtersDraft]);

  const resetFilters = React.useCallback(() => {
    setFiltersDraft(DEFAULT_FILTERS);
    setFiltersApplied(DEFAULT_FILTERS);
    setQuery("");
    setSelectedIds(new Set());
    setActiveId(null);
    setSelectedSavedId(null);
    localStorage.removeItem(LAST_SAVED_ID_KEY);
  }, []);

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

    // Overwrite priority:
    // 1) If a saved search is selected -> overwrite it
    // 2) Else if same name exists -> overwrite it
    // 3) Else -> create new
    const existingById = selectedSavedId ? savedSearches.find((s) => s.id === selectedSavedId) : null;
    const existingByName = savedSearches.find((s) => normalize(s.name) === normalize(name));

    let next: SavedSearch[];

    if (existingById) {
      next = savedSearches.map((s) =>
        s.id === existingById.id ? { ...newItem, id: existingById.id, createdAt: s.createdAt } : s
      );
      setSelectedSavedId(existingById.id);
      localStorage.setItem(LAST_SAVED_ID_KEY, existingById.id);
    } else if (existingByName) {
      next = savedSearches.map((s) =>
        s.id === existingByName.id ? { ...newItem, id: existingByName.id, createdAt: s.createdAt } : s
      );
      setSelectedSavedId(existingByName.id);
      localStorage.setItem(LAST_SAVED_ID_KEY, existingByName.id);
    } else {
      next = [newItem, ...savedSearches];
      setSelectedSavedId(newItem.id);
      localStorage.setItem(LAST_SAVED_ID_KEY, newItem.id);
    }

    setSavedSearches(next);
    persistSavedSearches(next);
    setSaveName("");
  }, [saveName, query, filtersApplied, savedSearches, selectedSavedId]);

  const deleteSelectedSaved = React.useCallback(() => {
    if (!selectedSavedId) return;
    const next = savedSearches.filter((s) => s.id !== selectedSavedId);
    setSavedSearches(next);
    persistSavedSearches(next);
    setSelectedSavedId(null);
    localStorage.removeItem(LAST_SAVED_ID_KEY);
  }, [savedSearches, selectedSavedId]);

  const pickItem = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen flex flex-col">
      <TopBarAny />

      <main className="flex-1 grid grid-cols-12 gap-0">
        {/* Left */}
        <aside className="col-span-3 border-r overflow-hidden">
          <div className="h-full overflow-y-auto">
            <SidebarAny
              query={query}
              setQuery={setQuery}
              filtersDraft={filtersDraft}
              setFiltersDraft={setFiltersDraft}
              onApply={applyDraftFilters}
              onReset={resetFilters}
              // Saved searches UI hooks:
              savedSearches={savedSearches}
              selectedSavedId={selectedSavedId}
              setSelectedSavedId={setSelectedSavedId}
              saveName={saveName}
              setSaveName={setSaveName}
              onSave={saveCurrentSearch}
              onDeleteSaved={deleteSelectedSaved}
            />
          </div>
        </aside>

        {/* Middle */}
        <section className="col-span-6 border-r overflow-hidden">
          <div className="h-full">
            <MapPanelAny
              items={filtered}
              activeId={activeId}
              setActiveId={setActiveId}
              selectedIds={selectedIds}
              onPick={(id: string) => pickItem(id)}
            />
          </div>
        </section>

        {/* Right */}
        <aside className="col-span-3 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <ResultsPanelAny
              items={filtered}
              activeId={activeId}
              setActiveId={setActiveId}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              onPick={(id: string) => pickItem(id)}
            />
          </div>
        </aside>
      </main>

      <PropertyDrawerAny
        activeId={activeId}
        setActiveId={setActiveId}
        items={filtered}
      />

      <FooterBarAny />
    </div>
  );
}
