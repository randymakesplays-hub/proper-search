"use client";

import type { ResultItem, SortOption } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Home, MapPin, Bed, Bath, Square, TrendingUp, ChevronRight,
  Download, Building, Calendar, Heart, ChevronLeft, List
} from "lucide-react";

type Props = {
  items: ResultItem[];
  activeId: string | null;
  hoveredId: string | null;
  selectedIds: string[];
  favoriteIds: string[];
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExport: () => void;
  isOpen: boolean;
  onClose: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "beds-desc", label: "Most Bedrooms" },
  { value: "sqft-desc", label: "Largest Size" },
  { value: "equity-desc", label: "Highest Equity" },
  { value: "newest", label: "Newest Listed" },
];

function formatPrice(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function getPropertyTypeIcon(type?: string) {
  switch (type) {
    case "condo":
      return <Building className="w-3 h-3" />;
    case "townhouse":
      return <Building className="w-3 h-3" />;
    default:
      return <Home className="w-3 h-3" />;
  }
}

export default function ResultsPanel({
  items,
  activeId,
  hoveredId,
  selectedIds,
  favoriteIds,
  onPick,
  onHover,
  onToggleSelect,
  onToggleFavorite,
  onSelectAll,
  onClearSelection,
  onExport,
  isOpen,
  onClose,
  sortOption,
  onSortChange,
}: Props) {
  return (
    <div
      className={cn(
        "bg-white border-l flex flex-col transition-all duration-300 relative",
        isOpen ? "w-96" : "w-0"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={onClose}
        className={cn(
          "absolute -left-10 top-4 w-10 h-10 bg-white border rounded-l-lg flex items-center justify-center shadow-sm hover:bg-muted transition-colors z-10",
          !isOpen && "-left-10"
        )}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <List className="w-5 h-5" />}
      </button>

      {isOpen && (
        <>
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Properties</h2>
              <span className="text-sm text-muted-foreground">
                {items.length} result{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <select
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="flex-1 text-xs bg-muted/50 border-0 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted transition-colors focus:ring-1 focus:ring-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              
              <Button variant="ghost" size="sm" onClick={onSelectAll} className="h-8 text-xs px-2">
                All
              </Button>
              {selectedIds.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 text-xs px-2">
                  Clear ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {/* Empty state */}
              {items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">No properties found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}

              {/* Property cards */}
              {items.map((item) => {
                const selected = selectedIds.includes(item.id);
                const active = activeId === item.id;
                const hovered = hoveredId === item.id;
                const isFavorite = favoriteIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => onPick(item.id)}
                    onMouseEnter={() => onHover(item.id)}
                    onMouseLeave={() => onHover(null)}
                    className={cn(
                      "rounded-xl border p-3 cursor-pointer transition-all group",
                      active
                        ? "border-primary bg-primary/5 shadow-md"
                        : hovered
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Checkbox */}
                      <div className="pt-0.5">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => onToggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Price and favorite */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(item.price)}
                            </span>
                            {item.propertyType && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
                                {getPropertyTypeIcon(item.propertyType)}
                                <span className="ml-1">{item.propertyType}</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(item.id);
                              }}
                              className={cn(
                                "p-1 rounded-full transition-colors",
                                isFavorite ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                            </button>
                            <ChevronRight className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform",
                              (active || hovered) && "text-primary translate-x-0.5"
                            )} />
                          </div>
                        </div>

                        {/* Address */}
                        <div className="font-medium text-sm truncate">{item.address}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {item.city}, {item.state} {item.zip}
                        </div>

                        {/* Stats */}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" />
                            {item.beds} bd
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5" />
                            {item.baths} ba
                          </span>
                          <span className="flex items-center gap-1">
                            <Square className="w-3.5 h-3.5" />
                            {item.sqft.toLocaleString()}
                          </span>
                          {item.equityPct != null && (
                            <Badge variant="default" className="text-[10px] h-5 px-1.5">
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                              {item.equityPct}%
                            </Badge>
                          )}
                        </div>

                        {/* Days on market & Tags */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {item.daysOnMarket != null && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              <Calendar className="w-3 h-3 mr-0.5" />
                              {item.daysOnMarket}d
                            </Badge>
                          )}
                          {item.tags && item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5 capitalize">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          {selectedIds.length > 0 && (
            <div className="p-3 border-t bg-primary/5">
              <Button onClick={onExport} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export {selectedIds.length} Propert{selectedIds.length === 1 ? "y" : "ies"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
