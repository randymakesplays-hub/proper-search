"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase, fetchProperties } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

import LeftSidebar, { type PageId } from "./components/LeftSidebar";
import SearchBar from "./components/SearchBar";
import MapPanel from "./components/MapPanel";
import ResultsPanel from "./components/ResultsPanel";
import PropertyDrawer from "./components/PropertyDrawer";
import FilterPanel from "./components/FilterPanel";
import AccountPage from "./components/AccountPage";
import MyPropertiesPage from "./components/MyPropertiesPage";
import LoginPage from "./components/LoginPage";
import MarketInsightsPanel from "./components/MarketInsightsPanel";
import AdminPage from "./components/AdminPage";
import PendingApprovalPage from "./components/PendingApprovalPage";

import type { Filters, ResultItem, SortOption } from "./types";
import { loadLastSearch, saveLastSearch } from "./components/SearchBar";

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

export default function Page() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check user approval status
  const checkUserStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("status")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Error checking user status:", error);
        // If no profile exists, assume approved (for existing users)
        setUserStatus("approved");
        return;
      }
      
      setUserStatus(data?.status || "approved");
    } catch (err) {
      console.error("Error checking user status:", err);
      setUserStatus("approved");
    }
  };

  // Always start with login page - sign out any existing session on mount
  useEffect(() => {
    // Sign out to always show login page first
    supabase.auth.signOut().then(() => {
      setUser(null);
      setUserStatus(null);
      setIsLoading(false);
    }).catch(() => {
      setUser(null);
      setUserStatus(null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          supabase.auth.signOut();
          setUser(null);
          setUserStatus(null);
        } else {
          setUser(session?.user ?? null);
          // Check user status when they sign in
          if (session?.user) {
            await checkUserStatus(session.user.id);
          } else {
            setUserStatus(null);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Get user info from Supabase user object
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  // Current page/view
  const [activePage, setActivePage] = useState<PageId>("search");

  // search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Property data from Supabase
  const [items, setItems] = useState<ResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // Search properties from Supabase
  const searchProperties = useCallback(async (query: string, currentFilters: Filters) => {
    setIsSearching(true);
    try {
      const { data, error } = await fetchProperties({
        query,
        filters: currentFilters,
        limit: 500,
      });

      if (error) {
        toast.error("Failed to search properties");
        console.error(error);
        return;
      }

      setItems(data ?? []);
      setHasSearched(true);
      setActiveId(null);
      setSelectedIds([]);
      setFitBoundsKey((k) => k + 1);
      
      // Save as last search for auto-load
      saveLastSearch(query, currentFilters);
    } catch (err) {
      toast.error("Failed to search properties");
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-load last search on mount
  useEffect(() => {
    const lastSearch = loadLastSearch();
    if (lastSearch) {
      setSearchQuery(lastSearch.query);
      setDebouncedQuery(lastSearch.query);
      setFilters(lastSearch.filters);
      // Trigger search after a short delay to ensure state is set
      setTimeout(() => {
        searchProperties(lastSearch.query, lastSearch.filters);
      }, 100);
    }
  }, [searchProperties]);

  // Quick filter toggles - triggers search
  const toggleQuickFilter = (key: keyof Filters) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    searchProperties(debouncedQuery, newFilters);
  };

  // Called when user clicks "Search" button or presses Enter
  const applySearch = () => {
    searchProperties(debouncedQuery, filters);
  };

  // Called when filters are applied from the filter panel
  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setShowFilters(false);
    searchProperties(debouncedQuery, newFilters);
    toast.success("Filters applied");
  };

  const clearAll = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setFilters(DEFAULT_FILTERS);
    setHasSearched(false);
    setItems([]);
    setActiveId(null);
    setSelectedIds([]);
    setDrawerOpen(false);
    setFitBoundsKey((k) => k + 1);
    toast.info("Filters cleared");
  };

  // Load a saved search
  const handleLoadSearch = (query: string, newFilters: Filters) => {
    setFilters(newFilters);
    searchProperties(query, newFilters);
  };

  // Sort results (filtering is done server-side now)
  const sortedItems: ResultItem[] = useMemo(() => {
    return [...items].sort((a, b) => {
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
        case "ppsqft-asc":
          return ((a.pricePerSqft ?? a.price / a.sqft) - (b.pricePerSqft ?? b.price / b.sqft));
        default:
          return 0;
      }
    });
  }, [items, sortOption]);

  // Items to display on map/results (empty until user searches)
  const displayItems = hasSearched ? sortedItems : [];

  // Get saved/favorited properties (from current items or need to fetch)
  const savedProperties = useMemo(() => {
    return items.filter((item) => favoriteIds.includes(item.id));
  }, [items, favoriteIds]);

  const activeItem = activeId ? items.find((x) => x.id === activeId) ?? null : null;

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
        return <AccountPage userName={userName} userEmail={userEmail} />;

      case "myProperties":
        return (
          <MyPropertiesPage
            savedProperties={savedProperties}
            favoriteIds={favoriteIds}
            onViewProperty={handleViewPropertyFromMyProperties}
          />
        );

      case "admin":
        return <AdminPage currentUserEmail={userEmail} />;

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
              isSearching={isSearching}
              filters={filters}
              onLoadSearch={handleLoadSearch}
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
              <div className="flex-1 relative overflow-hidden">
                <MapPanel
                  items={displayItems}
                  activeId={activeId}
                  hoveredId={hoveredId}
                  onPick={handlePick}
                  onHover={setHoveredId}
                  fitBoundsKey={fitBoundsKey}
                />
              </div>

              {/* Market Insights Panel (bottom pull-up) - positioned over map */}
              <MarketInsightsPanel
                items={displayItems}
                searchLocation={filters.city || debouncedQuery || undefined}
              />

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not logged in
  if (!user) {
    return <LoginPage onLogin={() => {}} />;
  }

  // Show pending approval page if user hasn't been approved yet
  if (userStatus === "pending") {
    return <PendingApprovalPage userEmail={userEmail} />;
  }

  // Show rejected message if user was rejected
  if (userStatus === "rejected") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Your account request was not approved. Please contact support if you believe this is an error.
          </p>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Left Sidebar */}
      <LeftSidebar 
        userName={userName} 
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
