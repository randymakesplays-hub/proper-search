"use client";

import { useState, useMemo } from "react";
import type { ResultItem } from "../types";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  DollarSign,
  Calendar,
  Home,
  Building,
  Percent,
  BarChart3,
  X,
} from "lucide-react";

type Props = {
  items: ResultItem[];
  searchLocation?: string;
};

// Calculate comprehensive market statistics
function calculateMarketStats(items: ResultItem[]) {
  if (items.length === 0) return null;

  const prices = items.map((i) => i.price);
  const sqfts = items.map((i) => i.sqft);
  const pricesPerSqft = items.map((i) => Math.round(i.price / i.sqft));
  const daysOnMarket = items.filter((i) => i.daysOnMarket != null).map((i) => i.daysOnMarket!);
  const equities = items.filter((i) => i.equityPct != null).map((i) => i.equityPct!);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
  const median = (arr: number[]) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Property type breakdown
  const propertyTypes: Record<string, number> = {};
  items.forEach((i) => {
    const type = i.propertyType || "unknown";
    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
  });

  // Bedroom distribution
  const bedroomDist: Record<number, { count: number; avgPrice: number; prices: number[] }> = {};
  items.forEach((i) => {
    const beds = i.beds;
    if (!bedroomDist[beds]) {
      bedroomDist[beds] = { count: 0, avgPrice: 0, prices: [] };
    }
    bedroomDist[beds].count++;
    bedroomDist[beds].prices.push(i.price);
  });
  Object.keys(bedroomDist).forEach((beds) => {
    const b = bedroomDist[Number(beds)];
    b.avgPrice = avg(b.prices);
  });

  // DOM by bedroom
  const domByBedroom: Record<number, number[]> = {};
  items.forEach((i) => {
    if (i.daysOnMarket != null) {
      if (!domByBedroom[i.beds]) domByBedroom[i.beds] = [];
      domByBedroom[i.beds].push(i.daysOnMarket);
    }
  });

  // Tag breakdown
  const tags = { absentee: 0, highEquity: 0, vacant: 0 };
  items.forEach((i) => {
    if (i.tags) {
      i.tags.forEach((tag) => {
        if (tag in tags) tags[tag as keyof typeof tags]++;
      });
    }
  });

  // Price ranges
  const priceRanges = [
    { label: "Under $100K", min: 0, max: 100000, count: 0 },
    { label: "$100K-$200K", min: 100000, max: 200000, count: 0 },
    { label: "$200K-$300K", min: 200000, max: 300000, count: 0 },
    { label: "$300K-$500K", min: 300000, max: 500000, count: 0 },
    { label: "$500K+", min: 500000, max: Infinity, count: 0 },
  ];
  items.forEach((i) => {
    const range = priceRanges.find((r) => i.price >= r.min && i.price < r.max);
    if (range) range.count++;
  });

  return {
    count: items.length,
    price: {
      avg: Math.round(avg(prices)),
      median: Math.round(median(prices)),
      min: Math.min(...prices),
      max: Math.max(...prices),
    },
    sqft: {
      avg: Math.round(avg(sqfts)),
      median: Math.round(median(sqfts)),
    },
    pricePerSqft: {
      avg: Math.round(avg(pricesPerSqft)),
      median: Math.round(median(pricesPerSqft)),
      min: Math.min(...pricesPerSqft),
      max: Math.max(...pricesPerSqft),
    },
    daysOnMarket: daysOnMarket.length
      ? {
          avg: Math.round(avg(daysOnMarket)),
          median: Math.round(median(daysOnMarket)),
          min: Math.min(...daysOnMarket),
          max: Math.max(...daysOnMarket),
        }
      : null,
    equity: equities.length
      ? {
          avg: Math.round(avg(equities)),
          median: Math.round(median(equities)),
          highCount: equities.filter((e) => e >= 30).length,
        }
      : null,
    propertyTypes,
    bedroomDist,
    domByBedroom,
    tags,
    priceRanges,
  };
}

function formatPrice(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default function MarketInsightsPanel({ items, searchLocation }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const stats = useMemo(() => calculateMarketStats(items), [items]);

  if (!stats || items.length === 0) return null;

  const locationLabel = searchLocation || "Current Search";

  // Get sorted bedroom keys
  const bedroomKeys = Object.keys(stats.bedroomDist)
    .map(Number)
    .sort((a, b) => a - b);

  // Get max values for chart scaling
  const maxBedroomCount = Math.max(...Object.values(stats.bedroomDist).map((b) => b.count));
  const maxPriceRangeCount = Math.max(...stats.priceRanges.map((r) => r.count));

  return (
    <div 
      className="absolute bottom-0 left-0 z-30 pointer-events-none"
      style={{ right: '384px' }} // Account for results panel width (w-96 = 384px)
    >
      {/* Toggle Tab - Always visible at bottom of map */}
      <div className="flex justify-center pointer-events-auto mb-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-t-xl shadow-xl transition-all duration-300 font-medium",
            "bg-primary text-white border-2 border-b-0 border-primary hover:bg-primary/90",
            isOpen && "bg-primary/90"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-medium">Statistics for {locationLabel}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Panel Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden bg-white border-t shadow-2xl pointer-events-auto",
          isOpen ? "h-[320px]" : "h-0"
        )}
      >
        <div className="h-full overflow-x-auto">
          <div className="p-4 min-w-[900px]">
            {/* Top Row - Key Metrics */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              {/* Avg Price */}
              <MetricCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Avg List Price"
                value={formatPrice(stats.price.avg)}
                subValue={`Median: ${formatPrice(stats.price.median)}`}
              />
              
              {/* Price Per Sqft */}
              <MetricCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Avg $/Sq.Ft."
                value={`$${stats.pricePerSqft.avg}`}
                subValue={`$${stats.pricePerSqft.min} - $${stats.pricePerSqft.max}`}
              />

              {/* Avg Sqft */}
              <MetricCard
                icon={<Home className="w-4 h-4" />}
                label="Avg Sq.Ft."
                value={stats.sqft.avg.toLocaleString()}
                subValue={`Median: ${stats.sqft.median.toLocaleString()}`}
              />

              {/* Days on Market */}
              {stats.daysOnMarket && (
                <MetricCard
                  icon={<Calendar className="w-4 h-4" />}
                  label="Avg DOM"
                  value={`${stats.daysOnMarket.avg} days`}
                  subValue={`${stats.daysOnMarket.min} - ${stats.daysOnMarket.max} days`}
                  highlight={stats.daysOnMarket.avg > 60}
                />
              )}

              {/* Equity */}
              {stats.equity && (
                <MetricCard
                  icon={<Percent className="w-4 h-4" />}
                  label="Avg Equity"
                  value={`${stats.equity.avg}%`}
                  subValue={`${stats.equity.highCount} high equity (30%+)`}
                  highlight={stats.equity.avg >= 30}
                  positive
                />
              )}

              {/* Total Properties */}
              <MetricCard
                icon={<Building className="w-4 h-4" />}
                label="Total Properties"
                value={stats.count.toLocaleString()}
                subValue={`In ${Object.keys(stats.propertyTypes).length} property types`}
              />
            </div>

            {/* Bottom Row - Charts */}
            <div className="grid grid-cols-4 gap-4">
              {/* Properties by Bedroom */}
              <ChartCard title="Properties by Bedroom">
                <div className="flex items-end justify-between h-24 gap-1">
                  {bedroomKeys.slice(0, 6).map((beds) => {
                    const data = stats.bedroomDist[beds];
                    const height = (data.count / maxBedroomCount) * 100;
                    return (
                      <div key={beds} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${data.count} properties`}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {beds === 0 ? "0" : beds}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-center text-muted-foreground mt-1">Bedrooms</div>
              </ChartCard>

              {/* Price Distribution */}
              <ChartCard title="Price Distribution">
                <div className="flex items-end justify-between h-24 gap-1">
                  {stats.priceRanges.map((range, i) => {
                    const height = maxPriceRangeCount > 0 
                      ? (range.count / maxPriceRangeCount) * 100 
                      : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-emerald-500/80 rounded-t transition-all hover:bg-emerald-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${range.count} properties`}
                        />
                        <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">
                          {range.label.replace("Under ", "<").replace("$", "").replace("K-$", "-").replace("K", "K").replace("+", "+")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              {/* Property Types */}
              <ChartCard title="Property Types">
                <div className="space-y-2">
                  {Object.entries(stats.propertyTypes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([type, count]) => {
                      const pct = Math.round((count / stats.count) * 100);
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <span className="text-xs capitalize w-20 truncate">{type}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500/80 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </ChartCard>

              {/* Lead Indicators */}
              <ChartCard title="Lead Indicators">
                <div className="space-y-2">
                  <IndicatorRow
                    label="Absentee Owners"
                    count={stats.tags.absentee}
                    total={stats.count}
                    color="bg-amber-500"
                  />
                  <IndicatorRow
                    label="High Equity (30%+)"
                    count={stats.tags.highEquity}
                    total={stats.count}
                    color="bg-emerald-500"
                  />
                  <IndicatorRow
                    label="Vacant Properties"
                    count={stats.tags.vacant}
                    total={stats.count}
                    color="bg-purple-500"
                  />
                </div>
              </ChartCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  subValue,
  highlight,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 border bg-gray-50",
        highlight && positive && "border-emerald-200 bg-emerald-50",
        highlight && !positive && "border-amber-200 bg-amber-50"
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div
        className={cn(
          "text-lg font-bold",
          highlight && positive && "text-emerald-600",
          highlight && !positive && "text-amber-600"
        )}
      >
        {value}
      </div>
      {subValue && (
        <div className="text-[10px] text-muted-foreground">{subValue}</div>
      )}
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs font-medium text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

// Indicator Row Component
function IndicatorRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-28 truncate">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right">
        {count} ({pct}%)
      </span>
    </div>
  );
}
