"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown
} from "lucide-react";

type Props = {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  resultCount: number;
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
  absenteeActive,
  highEquityActive,
  vacantActive,
  onToggleAbsentee,
  onToggleHighEquity,
  onToggleVacant,
}: Props) {
  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="City, Zip Code(s) or APN #"
              className="pl-9 pr-8 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button onClick={onSearch} className="h-10 px-4">
            <Search className="w-4 h-4 mr-2" />
            Search
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
          <Button variant="outline" size="sm" className="h-9">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
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
            count={0}
            active={absenteeActive}
            onClick={onToggleAbsentee}
          />
          <QuickFilterChip
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="High Equity"
            count={0}
            active={highEquityActive}
            onClick={onToggleHighEquity}
          />
          <QuickFilterChip
            icon={<Home className="w-3.5 h-3.5" />}
            label="Vacant"
            count={0}
            active={vacantActive}
            onClick={onToggleVacant}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Bookmark className="w-4 h-4 mr-2" />
            All Searches
          </Button>
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
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
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
      {typeof count === "number" && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
          active ? "bg-white/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
