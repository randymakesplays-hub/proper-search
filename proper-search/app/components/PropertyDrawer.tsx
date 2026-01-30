"use client";

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
import { toast } from "sonner";
import { 
  Copy, Download, MapPin, Bed, Bath, Square, TrendingUp, 
  Heart, Building, Calendar, DollarSign, ExternalLink 
} from "lucide-react";

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
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavorite}
                className={`h-10 w-10 shrink-0 ${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            )}
          </div>
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

        <Separator className="my-4" />

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
