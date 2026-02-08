"use client";

import type { Filters, PropertyType } from "../types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { X, User, TrendingUp, Home, MapPin, Bed, DollarSign, RotateCcw, Square, Building } from "lucide-react";

type Props = {
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
};

export default function FilterPanel({ filters: initialFilters, onApply, onClear, isOpen, onClose }: Props) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Sync with parent when panel opens
  useState(() => {
    setFilters(initialFilters);
  });

  const patch = (partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  const activeFilterCount = [
    filters.absentee,
    filters.highEquity,
    filters.vacant,
    filters.city,
    filters.minBeds,
    filters.maxPrice,
    filters.propertyType,
    filters.minSqft,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        "absolute left-0 top-0 bottom-0 w-72 bg-white border-r shadow-lg z-10 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Filters</h2>
            {activeFilterCount > 0 && (
              <p className="text-xs text-muted-foreground">{activeFilterCount} active</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Quick Filters Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Property Status
              </h3>
              <div className="space-y-3">
                <FilterToggle
                  icon={<User className="w-4 h-4" />}
                  label="Absentee Owner"
                  description="Owner lives elsewhere"
                  checked={!!filters.absentee}
                  onCheckedChange={(checked) => patch({ absentee: checked })}
                />
                <FilterToggle
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="High Equity"
                  description="50%+ equity in property"
                  checked={!!filters.highEquity}
                  onCheckedChange={(checked) => patch({ highEquity: checked })}
                />
                <FilterToggle
                  icon={<Home className="w-4 h-4" />}
                  label="Vacant"
                  description="Property appears vacant"
                  checked={!!filters.vacant}
                  onCheckedChange={(checked) => patch({ vacant: checked })}
                />
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Location
              </h3>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={filters.city ?? ""}
                  onChange={(e) => patch({ city: e.target.value })}
                  placeholder="Enter city name..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Property Type Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Property Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(["house", "condo", "townhouse", "multi-family", "land"] as PropertyType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => patch({ propertyType: filters.propertyType === type ? undefined : type })}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all border",
                      filters.propertyType === type
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    <Building className="w-4 h-4" />
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Property Details Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Property Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Bed className="w-4 h-4 text-muted-foreground" />
                    Minimum Bedrooms
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => patch({ minBeds: filters.minBeds === num ? undefined : num })}
                        className={cn(
                          "flex-1 h-10 rounded-lg font-medium text-sm transition-all border",
                          filters.minBeds === num
                            ? "bg-primary text-white border-primary"
                            : "bg-white border-border hover:border-primary/50"
                        )}
                      >
                        {num}+
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Square className="w-4 h-4 text-muted-foreground" />
                    Minimum Sqft
                  </label>
                  <div className="flex gap-2">
                    {[500, 1000, 1500, 2000].map((sqft) => (
                      <button
                        key={sqft}
                        onClick={() => patch({ minSqft: filters.minSqft === sqft ? undefined : sqft })}
                        className={cn(
                          "flex-1 h-10 rounded-lg font-medium text-xs transition-all border",
                          filters.minSqft === sqft
                            ? "bg-primary text-white border-primary"
                            : "bg-white border-border hover:border-primary/50"
                        )}
                      >
                        {sqft.toLocaleString()}+
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Maximum Price
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[200000, 400000, 600000, 800000, 1000000].map((price) => (
                      <button
                        key={price}
                        onClick={() => patch({ maxPrice: filters.maxPrice === price ? undefined : price })}
                        className={cn(
                          "flex-1 min-w-[60px] h-10 rounded-lg font-medium text-xs transition-all border",
                          filters.maxPrice === price
                            ? "bg-primary text-white border-primary"
                            : "bg-white border-border hover:border-primary/50"
                        )}
                      >
                        ${price >= 1000000 ? `${price / 1000000}M` : `${price / 1000}k`}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Input
                      type="number"
                      value={filters.maxPrice ?? ""}
                      onChange={(e) =>
                        patch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="Or enter custom amount..."
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={handleApply} className="w-full h-11 text-base font-semibold">
            Apply Filters
          </Button>
          <Button variant="ghost" onClick={handleClear} className="w-full h-9 text-sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterToggle({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
        checked ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            checked ? "bg-primary text-white" : "bg-muted"
          )}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
