"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ResultItem } from "../types";
import { 
  ChevronDown, ChevronRight, Search, Plus, List,
  Folder, Trash2, Tag, Flame, Phone, FileText, 
  CheckCircle, Download, X
} from "lucide-react";
import { toast } from "sonner";

// Property tag types
export type PropertyTag = "hot-lead" | "follow-up" | "offer-sent" | "under-contract" | "closed";

export const PROPERTY_TAGS: { id: PropertyTag; label: string; color: string; icon: React.ReactNode }[] = [
  { id: "hot-lead", label: "Hot Lead", color: "bg-red-100 text-red-800 border-red-200", icon: <Flame className="w-3 h-3" /> },
  { id: "follow-up", label: "Follow Up", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Phone className="w-3 h-3" /> },
  { id: "offer-sent", label: "Offer Sent", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <FileText className="w-3 h-3" /> },
  { id: "under-contract", label: "Under Contract", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <Tag className="w-3 h-3" /> },
  { id: "closed", label: "Closed", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-3 h-3" /> },
];

// Saved property with tags
export type SavedPropertyData = {
  id: string;
  tags: PropertyTag[];
  savedAt: string;
  notes?: string;
};

const FAVORITES_DATA_KEY = "proper-search-favorites-data";

// Load favorites data from localStorage
export function loadFavoritesData(): Record<string, SavedPropertyData> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(FAVORITES_DATA_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save favorites data to localStorage
export function saveFavoritesData(data: Record<string, SavedPropertyData>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_DATA_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Get tags for a property
export function getPropertyTags(propertyId: string): PropertyTag[] {
  const data = loadFavoritesData();
  return data[propertyId]?.tags ?? [];
}

// Set tags for a property
export function setPropertyTags(propertyId: string, tags: PropertyTag[]) {
  const data = loadFavoritesData();
  if (!data[propertyId]) {
    data[propertyId] = {
      id: propertyId,
      tags,
      savedAt: new Date().toISOString(),
    };
  } else {
    data[propertyId].tags = tags;
  }
  saveFavoritesData(data);
}

type Props = {
  savedProperties: ResultItem[];
  favoriteIds: string[];
  onViewProperty: (id: string) => void;
};

type FilterTab = "all" | PropertyTag;

const FILTER_TABS: { id: FilterTab; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "All Saved" },
  { id: "hot-lead", label: "Hot Lead", icon: <Flame className="w-3 h-3" /> },
  { id: "follow-up", label: "Follow Up", icon: <Phone className="w-3 h-3" /> },
  { id: "offer-sent", label: "Offer Sent", icon: <FileText className="w-3 h-3" /> },
  { id: "under-contract", label: "Under Contract", icon: <Tag className="w-3 h-3" /> },
  { id: "closed", label: "Closed", icon: <CheckCircle className="w-3 h-3" /> },
];

export default function MyPropertiesPage({ savedProperties, favoriteIds, onViewProperty }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [favoritesData, setFavoritesData] = useState<Record<string, SavedPropertyData>>({});
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    marketingLists: false,
    mobile: false,
  });

  // Load favorites data on mount
  useEffect(() => {
    setFavoritesData(loadFavoritesData());
  }, []);

  // Filter properties by active tab
  const filteredProperties = useMemo(() => {
    if (activeTab === "all") return savedProperties;
    return savedProperties.filter((p) => {
      const tags = favoritesData[p.id]?.tags ?? [];
      return tags.includes(activeTab);
    });
  }, [savedProperties, activeTab, favoritesData]);

  // Count properties per tag
  const tagCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: savedProperties.length } as Record<FilterTab, number>;
    PROPERTY_TAGS.forEach(tag => {
      counts[tag.id] = savedProperties.filter(p => 
        (favoritesData[p.id]?.tags ?? []).includes(tag.id)
      ).length;
    });
    return counts;
  }, [savedProperties, favoritesData]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProperties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProperties.map((p) => p.id));
    }
  };

  const toggleTag = (propertyId: string, tag: PropertyTag) => {
    const currentTags = favoritesData[propertyId]?.tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    
    setPropertyTags(propertyId, newTags);
    setFavoritesData(loadFavoritesData());
    
    const tagInfo = PROPERTY_TAGS.find(t => t.id === tag);
    if (newTags.includes(tag)) {
      toast.success(`Added "${tagInfo?.label}" tag`);
    } else {
      toast.success(`Removed "${tagInfo?.label}" tag`);
    }
  };

  const exportSelected = () => {
    const selectedItems = filteredProperties.filter((p) => selectedIds.includes(p.id));
    if (selectedItems.length === 0) {
      toast.error("No properties selected");
      return;
    }

    const headers = [
      "Address", "City", "State", "Zip", "Price", "Beds", "Baths", "Sqft",
      "Equity%", "Tags", "PropertyTags"
    ];

    const rows = selectedItems.map((item) => [
      `"${item.address}"`,
      `"${item.city}"`,
      item.state,
      item.zip,
      item.price,
      item.beds,
      item.baths,
      item.sqft,
      item.equityPct ?? "",
      `"${(item.tags ?? []).join("|")}"`,
      `"${(favoritesData[item.id]?.tags ?? []).join("|")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_properties_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedItems.length} properties`);
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
            {FILTER_TABS.map((tab) => {
              const count = tagCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors flex items-center gap-2",
                    activeTab === tab.id
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border hover:border-primary/50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <Badge 
                    variant={activeTab === tab.id ? "secondary" : "outline"} 
                    className={cn(
                      "h-5 px-1.5 text-[10px]",
                      activeTab === tab.id && "bg-white/20 text-white border-0"
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={exportSelected}>
                    <Download className="w-4 h-4 mr-1" />
                    Export ({selectedIds.length})
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedIds([])}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {activeTab === "all" ? "All Saved Properties" : FILTER_TABS.find(t => t.id === activeTab)?.label} ({filteredProperties.length})
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
                    checked={selectedIds.length === filteredProperties.length && filteredProperties.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">#</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Address</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">City</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">State</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Zip</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Price</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Beds</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Baths</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Sqft</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Equity</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Folder className="w-12 h-12 opacity-30" />
                      <p>{activeTab === "all" ? "No saved properties yet" : `No properties tagged as "${FILTER_TABS.find(t => t.id === activeTab)?.label}"`}</p>
                      <p className="text-sm">
                        {activeTab === "all" 
                          ? "Search for properties and save them to see them here"
                          : "Add this tag to properties to see them here"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property, idx) => {
                  const propertyTags = favoritesData[property.id]?.tags ?? [];
                  return (
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
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 flex-wrap">
                          {propertyTags.map((tag) => {
                            const tagInfo = PROPERTY_TAGS.find((t) => t.id === tag);
                            if (!tagInfo) return null;
                            return (
                              <Badge
                                key={tag}
                                className={cn("text-[10px] h-5 px-1.5 gap-1 border", tagInfo.color)}
                              >
                                {tagInfo.icon}
                                {tagInfo.label}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTag(property.id, tag);
                                  }}
                                  className="ml-0.5 hover:opacity-70"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </Badge>
                            );
                          })}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded hover:bg-muted">
                                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {PROPERTY_TAGS.map((tag) => {
                                const isActive = propertyTags.includes(tag.id);
                                return (
                                  <DropdownMenuItem
                                    key={tag.id}
                                    onClick={() => toggleTag(property.id, tag.id)}
                                    className={cn(
                                      "cursor-pointer gap-2",
                                      isActive && "bg-muted"
                                    )}
                                  >
                                    <div className={cn("p-1 rounded", tag.color)}>
                                      {tag.icon}
                                    </div>
                                    {tag.label}
                                    {isActive && <CheckCircle className="w-3.5 h-3.5 ml-auto text-green-600" />}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
