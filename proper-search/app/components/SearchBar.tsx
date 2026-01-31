"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  Save, 
  RotateCcw,
  User,
  TrendingUp,
  Home,
  Bookmark,
  ChevronDown,
  Loader2,
  Trash2,
  MapPin
} from "lucide-react";
import type { Filters } from "@/app/types";
import { fetchCitySuggestions } from "@/lib/supabase";

// Saved search type
export type SavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: Filters;
  createdAt: string;
};

const SAVED_SEARCHES_KEY = "proper-search-saved-searches";
const LAST_SEARCH_KEY = "proper-search-last-search";

// Helper functions for localStorage
export function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveSavedSearches(searches: SavedSearch[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // ignore
  }
}

export function loadLastSearch(): { query: string; filters: Filters } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LAST_SEARCH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveLastSearch(query: string, filters: Filters) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify({ query, filters }));
  } catch {
    // ignore
  }
}

type Props = {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  resultCount: number;
  isSearching?: boolean;
  filters: Filters;
  onLoadSearch?: (query: string, filters: Filters) => void;
  // Quick filter states
  absenteeActive?: boolean;
  highEquityActive?: boolean;
  vacantActive?: boolean;
  onToggleAbsentee?: () => void;
  onToggleHighEquity?: () => void;
  onToggleVacant?: () => void;
};

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  onClear,
  onToggleFilters,
  showFilters,
  resultCount,
  isSearching,
  filters,
  onLoadSearch,
  absenteeActive,
  highEquityActive,
  vacantActive,
  onToggleAbsentee,
  onToggleHighEquity,
  onToggleVacant,
}: Props) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved searches on mount
  useEffect(() => {
    setSavedSearches(loadSavedSearches());
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data } = await fetchCitySuggestions(query);
      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    // Extract just the city name (before the comma)
    const cityOnly = suggestion.split(",")[0].trim();
    setQuery(cityOnly);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    // Trigger search after selection
    setTimeout(() => onSearch(), 50);
  }, [setQuery, onSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") onSearch();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else {
          setShowSuggestions(false);
          onSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Save current search
  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      query,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSearch, ...savedSearches];
    setSavedSearches(updated);
    saveSavedSearches(updated);
    setSearchName("");
    setShowSaveDialog(false);
  };

  // Delete a saved search
  const handleDeleteSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    saveSavedSearches(updated);
  };

  // Load a saved search
  const handleLoadSearch = (search: SavedSearch) => {
    setQuery(search.query);
    onLoadSearch?.(search.query, search.filters);
  };

  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="City, Zip Code(s)"
              className="pl-9 pr-8 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              disabled={isSearching}
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left flex items-center gap-2 text-sm transition-colors",
                      index === highlightedIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => { setShowSuggestions(false); onSearch(); }} className="h-10 px-4" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border hidden md:block" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={onToggleFilters}
            className="h-9"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          {/* Save Search Dialog */}
          {showSaveDialog ? (
            <div className="flex items-center gap-2">
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                placeholder="Search name..."
                className="h-9 w-32"
                autoFocus
              />
              <Button size="sm" className="h-9" onClick={handleSaveSearch}>
                Save
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-2"
                onClick={() => {
                  setShowSaveDialog(false);
                  setSearchName("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={() => setShowSaveDialog(true)}
              disabled={!query && !Object.values(filters).some(Boolean)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
          
          <Button variant="ghost" size="sm" onClick={onClear} className="h-9">
            Clear All
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border hidden lg:block" />

        {/* Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <QuickFilterChip
            icon={<User className="w-3.5 h-3.5" />}
            label="Absentee"
            active={absenteeActive}
            onClick={onToggleAbsentee}
          />
          <QuickFilterChip
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="High Equity"
            active={highEquityActive}
            onClick={onToggleHighEquity}
          />
          <QuickFilterChip
            icon={<Home className="w-3.5 h-3.5" />}
            label="Vacant"
            active={vacantActive}
            onClick={onToggleVacant}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Bookmark className="w-4 h-4 mr-2" />
                All Searches
                {savedSearches.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                    {savedSearches.length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {savedSearches.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No saved searches yet
                </div>
              ) : (
                <>
                  {savedSearches.map((search) => (
                    <DropdownMenuItem
                      key={search.id}
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => handleLoadSearch(search)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{search.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {search.query || "All properties"}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSearch(search.id, e)}
                        className="ml-2 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={() => {
                      setSavedSearches([]);
                      saveSavedSearches([]);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear all saved searches
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {resultCount > 0 && (
            <Badge variant="secondary" className="h-7 px-3">
              {resultCount.toLocaleString()} results
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickFilterChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
        active
          ? "bg-primary text-white border-primary"
          : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
