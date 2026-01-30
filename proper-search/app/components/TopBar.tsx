"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, SlidersHorizontal, List, MapPin, RotateCcw, Command } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  onSearch: () => void;
  onClear: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  showResults: boolean;
  onToggleResults: () => void;
  resultCount: number;
};

export default function TopBar({
  query,
  setQuery,
  onSearch,
  onClear,
  showFilters,
  onToggleFilters,
  showResults,
  onToggleResults,
  resultCount,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
      // Cmd/Ctrl + F to toggle filters
      if ((e.metaKey || e.ctrlKey) && e.key === "f" && !e.shiftKey) {
        e.preventDefault();
        onToggleFilters();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setQuery, onToggleFilters]);
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 md:gap-3">
      {/* Logo */}
      <div className="bg-white rounded-xl shadow-lg px-3 md:px-4 py-2.5 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <MapPin className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold hidden md:block">ProperSearch</span>
      </div>

      {/* Search bar */}
      <div className="flex-1 min-w-0 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg flex items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="Search address, city, zip..."
              className="pl-9 md:pl-12 pr-16 h-11 md:h-12 border-0 bg-transparent text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {/* Keyboard hint */}
            {!query && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-xs text-muted-foreground/60">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            )}
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="h-6 md:h-8 w-px bg-border hidden sm:block" />
          <Button 
            onClick={onSearch} 
            variant="ghost" 
            className="h-11 md:h-12 px-3 md:px-5 rounded-l-none hidden sm:flex"
          >
            Search
          </Button>
          <Button 
            onClick={onSearch} 
            variant="ghost" 
            size="icon"
            className="h-11 w-11 rounded-l-none sm:hidden shrink-0"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleFilters}
          className={cn(
            "h-11 w-11 md:h-12 md:w-12 rounded-xl shadow-lg bg-white border-0",
            showFilters && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <SlidersHorizontal className="w-4 md:w-5 h-4 md:h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleResults}
          className={cn(
            "h-11 w-11 md:h-12 md:w-12 rounded-xl shadow-lg bg-white border-0 relative",
            showResults && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <List className="w-4 md:w-5 h-4 md:h-5" />
          {resultCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
              {resultCount > 99 ? "99+" : resultCount}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          className="h-11 w-11 md:h-12 md:w-auto rounded-xl shadow-lg bg-white border-0 md:px-4"
        >
          <RotateCcw className="w-4 md:w-5 h-4 md:h-5 md:hidden" />
          <span className="hidden md:inline">Clear</span>
        </Button>
      </div>
    </div>
  );
}
