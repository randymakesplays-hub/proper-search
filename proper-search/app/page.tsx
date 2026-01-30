"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import LeftSidebar, { type PageId } from "./components/LeftSidebar";
import SearchBar from "./components/SearchBar";
import MapPanel from "./components/MapPanel";
import ResultsPanel from "./components/ResultsPanel";
import PropertyDrawer from "./components/PropertyDrawer";
import FilterPanel from "./components/FilterPanel";
import AccountPage from "./components/AccountPage";
import MyPropertiesPage from "./components/MyPropertiesPage";

import { mockItems } from "./data/mockItems";
import type { Filters, ResultItem, SortOption } from "./types";

const DEFAULT_FILTERS: Filters = {
  absentee: false,
  highEquity: false,
  vacant: false,
  city: "",
  minBeds: undefined,
  maxPrice: undefined,
  propertyType: undefined,
  minSqft: undefined,
};

// Helper to load favorites from localStorage
function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("propertyFavorites");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save favorites to localStorage
function saveFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("propertyFavorites", JSON.stringify(ids));
  } catch {
    // ignore
  }
}

// User info (would come from auth in real app)
const USER_NAME = "Randy Wilson";
const USER_EMAIL = "rawrealestate101@gmail.com";

export default function Page() {
  // Current page/view
  const [activePage, setActivePage] = useState<PageId>("search");

  // search - live search with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query for live search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // filters
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // selection
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // sorting
  const [sortOption, setSortOption] = useState<SortOption>("price-desc");

  // Load favorites from localStorage on mount
  useEffect(() => {
    setFavoriteIds(loadFavorites());
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (favoriteIds.length > 0 || localStorage.getItem("propertyFavorites")) {
      saveFavorites(favoriteIds);
    }
  }, [favoriteIds]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const isFavorited = prev.includes(id);
      const newFavorites = isFavorited
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
      return newFavorites;
    });
  }, []);

  // panel visibility
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Map bounds key - only changes when user explicitly searches
  const [fitBoundsKey, setFitBoundsKey] = useState(0);

  // Track if user has performed a search (map starts clean)
  const [hasSearched, setHasSearched] = useState(false);

  // Quick filter toggles
  const toggleQuickFilter = (key: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasSearched(true);
    setFitBoundsKey((k) => k + 1);
  };

  // Called when user clicks "Search" button or presses Enter
  const applySearch = () => {
    setHasSearched(true);
    setActiveId(null);
    setSelectedIds([]);
    setFitBoundsKey((k) => k + 1);
  };

  // Called when filters are applied from the filter panel
  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setHasSearched(true);
    setActiveId(null);
    setSelectedIds([]);
    setFitBoundsKey((k) => k + 1);
    setShowFilters(false);
    toast.success("Filters applied");
  };

  const clearAll = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setFilters(DEFAULT_FILTERS);
    setHasSearched(false);
    setActiveId(null);
    setSelectedIds([]);
    setDrawerOpen(false);
    setFitBoundsKey((k) => k + 1);
    toast.info("Filters cleared");
  };

  const filteredItems: ResultItem[] = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const city = (filters.city ?? "").trim().toLowerCase();
    const minBeds = filters.minBeds;
    const maxPrice = filters.maxPrice;
    const propertyType = filters.propertyType;
    const minSqft = filters.minSqft;

    const mustAbsentee = !!filters.absentee;
    const mustHighEquity = !!filters.highEquity;
    const mustVacant = !!filters.vacant;

    const filtered = mockItems.filter((item) => {
      const tags = (item.tags ?? []).map((t) => t.toLowerCase());
      if (mustAbsentee && !tags.includes("absentee")) return false;
      if (mustHighEquity && !tags.includes("highequity") && !tags.includes("high equity"))
        return false;
      if (mustVacant && !tags.includes("vacant")) return false;

      if (city && !item.city?.toLowerCase().includes(city)) return false;
      if (typeof minBeds === "number" && item.beds < minBeds) return false;
      if (typeof maxPrice === "number" && item.price > maxPrice) return false;
      if (propertyType && item.propertyType !== propertyType) return false;
      if (typeof minSqft === "number" && item.sqft < minSqft) return false;

      if (q) {
        const haystack = [item.address, item.city, item.state, item.zip, String(item.price)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    // Sort results
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "beds-desc":
          return b.beds - a.beds;
        case "sqft-desc":
          return b.sqft - a.sqft;
        case "equity-desc":
          return (b.equityPct ?? 0) - (a.equityPct ?? 0);
        case "newest":
          return (a.daysOnMarket ?? 999) - (b.daysOnMarket ?? 999);
        default:
          return 0;
      }
    });
  }, [debouncedQuery, filters, sortOption]);

  // Items to display on map/results (empty until user searches)
  const displayItems = hasSearched ? filteredItems : [];

  // Get saved/favorited properties
  const savedProperties = useMemo(() => {
    return mockItems.filter((item) => favoriteIds.includes(item.id));
  }, [favoriteIds]);

  const activeItem = activeId ? mockItems.find((x) => x.id === activeId) ?? null : null;

  const handlePick = (id: string) => {
    setActiveId(id);
    setDrawerOpen(true);
  };

  const handleViewPropertyFromMyProperties = (id: string) => {
    setActiveId(id);
    setDrawerOpen(true);
  };

  const onToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const exportSelected = useCallback(() => {
    const selectedItems = displayItems.filter((item) => selectedIds.includes(item.id));
    if (selectedItems.length === 0) {
      toast.error("No properties selected");
      return;
    }

    const headers = [
      "id", "address", "city", "state", "zip", "price", "beds", "baths",
      "sqft", "equityPct", "propertyType", "yearBuilt", "lat", "lng", "tags"
    ];

    const rows = selectedItems.map((item) => [
      item.id,
      `"${item.address}"`,
      `"${item.city}"`,
      item.state,
      item.zip,
      item.price,
      item.beds,
      item.baths,
      item.sqft,
      item.equityPct ?? "",
      item.propertyType,
      item.yearBuilt ?? "",
      item.lat,
      item.lng,
      `"${(item.tags ?? []).join("|")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `properties_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedItems.length} properties`);
  }, [displayItems, selectedIds]);

  // Render the main content based on active page
  const renderMainContent = () => {
    switch (activePage) {
      case "account":
        return <AccountPage userName={USER_NAME} userEmail={USER_EMAIL} />;

      case "myProperties":
        return (
          <MyPropertiesPage
            savedProperties={savedProperties}
            favoriteIds={favoriteIds}
            onViewProperty={handleViewPropertyFromMyProperties}
          />
        );

      case "contacts":
      case "campaigns":
      case "dialer":
        return (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 capitalize">{activePage}</h2>
              <p className="text-muted-foreground">This feature is coming soon</p>
            </div>
          </div>
        );

      case "search":
      default:
        return (
          <>
            {/* Top Search Bar */}
            <SearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              onSearch={applySearch}
              onClear={clearAll}
              onToggleFilters={() => setShowFilters(!showFilters)}
              showFilters={showFilters}
              resultCount={displayItems.length}
              absenteeActive={filters.absentee}
              highEquityActive={filters.highEquity}
              vacantActive={filters.vacant}
              onToggleAbsentee={() => toggleQuickFilter("absentee")}
              onToggleHighEquity={() => toggleQuickFilter("highEquity")}
              onToggleVacant={() => toggleQuickFilter("vacant")}
            />

            {/* Map and Results Area */}
            <div className="flex-1 flex relative overflow-hidden">
              {/* Filter Panel (slide out) */}
              <FilterPanel
                filters={filters}
                onApply={applyFilters}
                onClear={clearAll}
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
              />

              {/* Map */}
              <div className="flex-1 relative">
                <MapPanel
                  items={displayItems}
                  activeId={activeId}
                  hoveredId={hoveredId}
                  onPick={handlePick}
                  onHover={setHoveredId}
                  fitBoundsKey={fitBoundsKey}
                />
              </div>

              {/* Results Panel (right side) */}
              <ResultsPanel
                items={displayItems}
                activeId={activeId}
                hoveredId={hoveredId}
                selectedIds={selectedIds}
                favoriteIds={favoriteIds}
                onPick={handlePick}
                onHover={setHoveredId}
                onToggleSelect={onToggleSelect}
                onToggleFavorite={toggleFavorite}
                onSelectAll={() => setSelectedIds(displayItems.map((x) => x.id))}
                onClearSelection={() => setSelectedIds([])}
                onExport={exportSelected}
                isOpen={showResults}
                onClose={() => setShowResults(!showResults)}
                sortOption={sortOption}
                onSortChange={setSortOption}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Left Sidebar */}
      <LeftSidebar 
        userName={USER_NAME} 
        activePage={activePage}
        onPageChange={setActivePage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderMainContent()}
      </div>

      {/* Property detail drawer */}
      <PropertyDrawer
        item={activeItem}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isFavorite={activeItem ? favoriteIds.includes(activeItem.id) : false}
        onToggleFavorite={() => activeItem && toggleFavorite(activeItem.id)}
      />
    </div>
  );
}
