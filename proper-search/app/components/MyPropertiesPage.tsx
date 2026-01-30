"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ResultItem } from "../types";
import { 
  ChevronDown, ChevronRight, Search, Plus, List,
  Folder, Trash2
} from "lucide-react";

type Props = {
  savedProperties: ResultItem[];
  favoriteIds: string[];
  onViewProperty: (id: string) => void;
};

type FilterTab = "total" | "onMarket" | "justSold" | "vacant" | "highEquity" | "lowEquity" | "negEquity" | "bankOwned" | "preForeclosure" | "auction" | "hasLien" | "freeClear" | "bankruptcy";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "total", label: "Total" },
  { id: "onMarket", label: "On Market" },
  { id: "justSold", label: "Just Sold" },
  { id: "vacant", label: "Vacant" },
  { id: "highEquity", label: "High Equity" },
  { id: "lowEquity", label: "Low Equity" },
  { id: "negEquity", label: "Neg Equity" },
  { id: "bankOwned", label: "Bank Owned" },
  { id: "preForeclosure", label: "Pre-Foreclosure" },
  { id: "auction", label: "Auction" },
  { id: "hasLien", label: "Has Lien" },
  { id: "freeClear", label: "Free & Clear" },
  { id: "bankruptcy", label: "Bankruptcy" },
];

export default function MyPropertiesPage({ savedProperties, favoriteIds, onViewProperty }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("total");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    marketingLists: false,
    mobile: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === savedProperties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(savedProperties.map((p) => p.id));
    }
  };


  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar - Lists */}
      <div className="w-56 border-r bg-white flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">My Properties</h2>
          <Trash2 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>

        <ScrollArea className="flex-1">
          {/* Favorites Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection("favorites")}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {expandedSections.favorites ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">Favorites</span>
                {favoriteIds.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {favoriteIds.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <List className="w-3.5 h-3.5 text-muted-foreground" />
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
            {expandedSections.favorites && (
              <div className="pb-2">
                <button className="w-full flex items-center justify-between px-6 py-1.5 text-sm hover:bg-muted/50 text-left bg-muted/30">
                  <span className="truncate">All Saved Properties</span>
                  <span className="text-muted-foreground text-xs">({savedProperties.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Marketing Lists Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection("marketingLists")}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {expandedSections.marketingLists ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">Marketing Lists</span>
              </div>
              <div className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <List className="w-3.5 h-3.5 text-muted-foreground" />
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
            {expandedSections.marketingLists && (
              <div className="pb-2 px-6 py-2 text-xs text-muted-foreground">
                No marketing lists yet
              </div>
            )}
          </div>

          {/* Mobile Section */}
          <div>
            <button
              onClick={() => toggleSection("mobile")}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {expandedSections.mobile ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">Mobile</span>
              </div>
              <div className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <List className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
            {expandedSections.mobile && (
              <div className="pb-2 px-6 py-2 text-xs text-muted-foreground">
                No mobile favorites yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {/* Filter Tabs */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-border hover:border-primary/50"
                )}
              >
                <div className="text-xs text-muted-foreground mb-0.5">
                  {tab.id === "total" ? savedProperties.length : "—"}
                </div>
                <div>{tab.label}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {/* Action buttons would go here */}
            </div>
            <div className="text-sm text-muted-foreground">
              All Saved Properties ({savedProperties.length})
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full bg-white">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="w-10 p-3">
                  <Checkbox
                    checked={selectedIds.length === savedProperties.length && savedProperties.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">#</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Address</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Unit</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">City</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">State</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Zip</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Price</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Beds</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Baths</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Sqft</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Equity %</th>
              </tr>
            </thead>
            <tbody>
              {savedProperties.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Folder className="w-12 h-12 opacity-30" />
                      <p>No saved properties yet</p>
                      <p className="text-sm">Search for properties and save them to see them here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                savedProperties.map((property, idx) => (
                  <tr
                    key={property.id}
                    onClick={() => onViewProperty(property.id)}
                    className="border-t hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(property.id)}
                        onCheckedChange={() => toggleSelect(property.id)}
                      />
                    </td>
                    <td className="p-3 text-sm">{idx + 1}</td>
                    <td className="p-3 text-sm font-medium">{property.address}</td>
                    <td className="p-3 text-sm">—</td>
                    <td className="p-3 text-sm">{property.city}</td>
                    <td className="p-3 text-sm">{property.state}</td>
                    <td className="p-3 text-sm">{property.zip}</td>
                    <td className="p-3 text-sm font-medium text-primary">
                      ${property.price.toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">{property.beds}</td>
                    <td className="p-3 text-sm">{property.baths}</td>
                    <td className="p-3 text-sm">{property.sqft.toLocaleString()}</td>
                    <td className="p-3 text-sm">
                      {property.equityPct != null && (
                        <Badge variant={property.equityPct >= 50 ? "default" : "secondary"}>
                          {property.equityPct}%
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
