"use client";

import { useState, useEffect } from "react";
import type { ResultItem } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Copy, Download, MapPin, Bed, Bath, Square, TrendingUp, 
  Heart, Building, Calendar, DollarSign, ExternalLink, Loader2,
  BarChart3, Home, Navigation, Tag, ChevronDown, CheckCircle
} from "lucide-react";
import { fetchComps, calculateARV, type CompItem } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { 
  PROPERTY_TAGS, 
  type PropertyTag, 
  loadFavoritesData, 
  setPropertyTags 
} from "./MyPropertiesPage";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

// Calculate estimated monthly mortgage payment
function calculateMortgage(price: number, downPaymentPct = 0.2, interestRate = 0.07, years = 30) {
  const principal = price * (1 - downPaymentPct);
  const monthlyRate = interestRate / 12;
  const numPayments = years * 12;
  
  if (monthlyRate === 0) return principal / numPayments;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.round(payment);
}

type TabId = "details" | "comps";

type Props = {
  item: ResultItem | null;
  open: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export default function PropertyDrawer({ 
  item, 
  open, 
  onClose, 
  isFavorite = false,
  onToggleFavorite 
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [comps, setComps] = useState<CompItem[]>([]);
  const [compsLoading, setCompsLoading] = useState(false);
  const [compsError, setCompsError] = useState<string | null>(null);
  const [propertyTags, setPropertyTagsState] = useState<PropertyTag[]>([]);

  // Load property tags when item changes
  useEffect(() => {
    if (item) {
      const data = loadFavoritesData();
      setPropertyTagsState(data[item.id]?.tags ?? []);
    }
  }, [item]);

  // Reset tab when drawer closes or item changes
  useEffect(() => {
    if (!open) {
      setActiveTab("details");
      setComps([]);
      setCompsError(null);
    }
  }, [open]);

  const togglePropertyTag = (tag: PropertyTag) => {
    if (!item) return;
    
    const newTags = propertyTags.includes(tag)
      ? propertyTags.filter((t) => t !== tag)
      : [...propertyTags, tag];
    
    setPropertyTags(item.id, newTags);
    setPropertyTagsState(newTags);
    
    const tagInfo = PROPERTY_TAGS.find(t => t.id === tag);
    if (newTags.includes(tag)) {
      toast.success(`Added "${tagInfo?.label}" tag`);
    } else {
      toast.success(`Removed "${tagInfo?.label}" tag`);
    }
  };

  // Fetch comps when switching to comps tab
  useEffect(() => {
    if (activeTab === "comps" && item && comps.length === 0 && !compsLoading) {
      loadComps();
    }
  }, [activeTab, item]);

  const loadComps = async () => {
    if (!item) return;
    
    setCompsLoading(true);
    setCompsError(null);
    
    try {
      const { data, error } = await fetchComps({
        property: item,
        radiusMiles: 1, // 1 mile radius
        sqftTolerance: 0.25, // 25% sqft tolerance
        limit: 15,
      });

      if (error) {
        setCompsError("Failed to load comparable properties");
        console.error(error);
        return;
      }

      setComps(data ?? []);
    } catch (err) {
      setCompsError("Failed to load comparable properties");
      console.error(err);
    } finally {
      setCompsLoading(false);
    }
  };

  if (!item) return null;

  const equity = Math.max(0, Math.min(100, Number(item.equityPct ?? 0)));

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const fullAddress = `${item.address}, ${item.city}, ${item.state} ${item.zip}`;
  const coords = `${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)}`;
  const pricePerSqft = Math.round(item.price / item.sqft);

  const exportCSV = () => {
    const rows = [
      ["id", item.id],
      ["price", String(item.price)],
      ["address", item.address],
      ["city", item.city],
      ["state", item.state],
      ["zip", item.zip],
      ["beds", String(item.beds)],
      ["baths", String(item.baths)],
      ["sqft", String(item.sqft)],
      ["equityPct", String(equity)],
      ["lat", String(item.lat)],
      ["lng", String(item.lng)],
      ["propertyType", item.propertyType ?? ""],
      ["yearBuilt", String(item.yearBuilt ?? "")],
      ["daysOnMarket", String(item.daysOnMarket ?? "")],
      ["tags", (item.tags ?? []).join("|")],
    ];

    const csv = rows.map(([k, v]) => `${k},${JSON.stringify(v ?? "")}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property_${item.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Property exported", {
      description: "CSV file downloaded successfully",
    });
  };

  const handleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(item.id);
    }
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
    window.open(url, "_blank");
  };

  // Calculate ARV from comps
  const arvData = calculateARV(item.sqft, comps);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetDescription className="text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Property Details
              </SheetDescription>
              <SheetTitle className="text-lg leading-tight pr-2">{item.address}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {item.city}, {item.state} {item.zip}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Tag Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Tag className="w-4 h-4" />
                    {propertyTags.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1 text-[10px]">
                        {propertyTags.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {PROPERTY_TAGS.map((tag) => {
                    const isActive = propertyTags.includes(tag.id);
                    return (
                      <DropdownMenuItem
                        key={tag.id}
                        onClick={() => togglePropertyTag(tag.id)}
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

              {/* Favorite Button */}
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavorite}
                  className={`h-10 w-10 ${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Property Tags Display */}
          {propertyTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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
                  </Badge>
                );
              })}
            </div>
          )}
        </SheetHeader>

        <div className="px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatMoney(item.price)}
            </span>
            <span className="text-sm text-muted-foreground">
              ${pricePerSqft}/sqft
            </span>
          </div>
          {item.propertyType && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                <Building className="w-3 h-3 mr-1" />
                {item.propertyType}
              </Badge>
              {item.yearBuilt && (
                <Badge variant="outline">
                  Built {item.yearBuilt}
                </Badge>
              )}
              {item.daysOnMarket != null && (
                <Badge variant="secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  {item.daysOnMarket}d on market
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="px-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => copy(fullAddress, "Address")}>
            <Copy className="w-3 h-3 mr-1" />
            Copy Address
          </Button>
          <Button variant="outline" size="sm" onClick={() => copy(coords, "Coordinates")}>
            <Copy className="w-3 h-3 mr-1" />
            Copy Coords
          </Button>
          <Button variant="outline" size="sm" onClick={openInMaps}>
            <ExternalLink className="w-3 h-3 mr-1" />
            Google Maps
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-4 mt-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="w-4 h-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab("comps")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "comps"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Comps
              {comps.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {comps.length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          {activeTab === "details" ? (
            <DetailsTab item={item} equity={equity} pricePerSqft={pricePerSqft} coords={coords} />
          ) : (
            <CompsTab 
              item={item} 
              comps={comps} 
              loading={compsLoading} 
              error={compsError}
              arvData={arvData}
              onRetry={loadComps}
            />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Details Tab Component
function DetailsTab({ 
  item, 
  equity, 
  pricePerSqft, 
  coords 
}: { 
  item: ResultItem; 
  equity: number; 
  pricePerSqft: number; 
  coords: string; 
}) {
  return (
    <div className="space-y-4 py-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 gap-1 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Bed className="w-3 h-3" />
            Beds
          </div>
          <div className="text-xl font-semibold">{item.beds}</div>
        </Card>
        <Card className="p-3 gap-1 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Bath className="w-3 h-3" />
            Baths
          </div>
          <div className="text-xl font-semibold">{item.baths}</div>
        </Card>
        <Card className="p-3 gap-1 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Square className="w-3 h-3" />
            Sqft
          </div>
          <div className="text-xl font-semibold">{item.sqft.toLocaleString()}</div>
        </Card>
      </div>

      {/* Equity */}
      <Card className="p-3 gap-2 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            Equity
          </div>
          <span className="text-lg font-semibold">{equity}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${equity}%` }}
          />
        </div>
        {equity >= 50 && (
          <p className="text-xs text-green-600 mt-1">High equity property</p>
        )}
      </Card>

      {/* Price Analysis */}
      <Card className="p-3 gap-2 py-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          Price Analysis
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <div className="text-xs text-muted-foreground">Price/Sqft</div>
            <div className="text-lg font-semibold">${pricePerSqft}</div>
          </div>
          {item.lotSize && (
            <div>
              <div className="text-xs text-muted-foreground">Lot Size</div>
              <div className="text-lg font-semibold">{item.lotSize.toLocaleString()} sqft</div>
            </div>
          )}
        </div>
      </Card>

      {/* Mortgage Estimate */}
      <Card className="p-3 gap-2 py-3 bg-primary/5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          Est. Monthly Payment
        </div>
        <div className="text-2xl font-bold text-primary">
          {formatMoney(calculateMortgage(item.price))}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Based on 20% down, 7% APR, 30-year fixed
        </p>
      </Card>

      {/* Coordinates */}
      <Card className="p-3 gap-1 py-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          Coordinates
        </div>
        <div className="text-sm font-medium font-mono">{coords}</div>
      </Card>

      {/* Tags */}
      <Card className="p-3 gap-2 py-3">
        <div className="text-xs text-muted-foreground">Tags</div>
        <div className="flex flex-wrap gap-2">
          {(item.tags ?? []).length === 0 ? (
            <span className="text-sm text-muted-foreground">No tags</span>
          ) : (
            item.tags?.map((t) => (
              <Badge key={t} variant="secondary" className="capitalize">
                {t}
              </Badge>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// Comps Tab Component
function CompsTab({ 
  item,
  comps, 
  loading, 
  error,
  arvData,
  onRetry
}: { 
  item: ResultItem;
  comps: CompItem[]; 
  loading: boolean;
  error: string | null;
  arvData: ReturnType<typeof calculateARV>;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading comparable properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  if (comps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          No comparable sold properties found within 1 mile
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Try expanding search criteria
        </p>
      </div>
    );
  }

  const subjectPricePerSqft = Math.round(item.price / item.sqft);

  return (
    <div className="space-y-4 py-4">
      {/* ARV Summary Card */}
      {arvData && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">ARV Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-green-700">Estimated ARV</div>
              <div className="text-2xl font-bold text-green-800">
                {formatMoney(arvData.estimatedARV)}
              </div>
            </div>
            <div>
              <div className="text-xs text-green-700">Based on</div>
              <div className="text-lg font-semibold text-green-800">
                {arvData.compCount} comps
              </div>
            </div>
          </div>
          <Separator className="my-3 bg-green-200" />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-green-700">Avg $/sqft</div>
              <div className="font-semibold text-green-800">${arvData.avgPricePerSqft}</div>
            </div>
            <div>
              <div className="text-xs text-green-700">Median $/sqft</div>
              <div className="font-semibold text-green-800">${arvData.medianPricePerSqft}</div>
            </div>
            <div>
              <div className="text-xs text-green-700">Subject $/sqft</div>
              <div className="font-semibold text-green-800">${subjectPricePerSqft}</div>
            </div>
          </div>
          {arvData.estimatedARV > item.price && (
            <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
              Potential upside: <span className="font-bold">{formatMoney(arvData.estimatedARV - item.price)}</span>
            </div>
          )}
        </Card>
      )}

      {/* Comps Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Home className="w-4 h-4" />
          Comparable Sales ({comps.length})
        </h3>
        <div className="space-y-2">
          {comps.map((comp) => (
            <CompCard key={comp.id} comp={comp} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Comp Card
function CompCard({ comp }: { comp: CompItem }) {
  const pricePerSqft = comp.soldPrice ? Math.round(comp.soldPrice / comp.sqft) : null;
  const soldDate = comp.soldDate ? new Date(comp.soldDate).toLocaleDateString() : "N/A";
  
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{comp.address}</div>
          <div className="text-xs text-muted-foreground">
            {comp.city}, {comp.state} {comp.zip}
          </div>
        </div>
        {comp.distance !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Navigation className="w-3 h-3" />
            {comp.distance.toFixed(2)} mi
          </div>
        )}
      </div>
      <Separator className="my-2" />
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Sold</div>
          <div className="font-semibold">{soldDate}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Price</div>
          <div className="font-semibold text-green-600">
            {comp.soldPrice ? formatMoney(comp.soldPrice) : "N/A"}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Sqft</div>
          <div className="font-semibold">{comp.sqft.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground">$/Sqft</div>
          <div className="font-semibold">{pricePerSqft ? `$${pricePerSqft}` : "N/A"}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Bed className="w-3 h-3" /> {comp.beds}
        <Bath className="w-3 h-3 ml-2" /> {comp.baths}
        <Building className="w-3 h-3 ml-2" /> 
        <span className="capitalize">{comp.propertyType}</span>
      </div>
    </Card>
  );
}
