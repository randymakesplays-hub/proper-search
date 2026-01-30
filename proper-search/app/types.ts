// app/types.ts

export type PropertyType = "house" | "condo" | "townhouse" | "land" | "multi-family";

export type ResultItem = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  price: number;
  beds: number;
  baths: number;
  sqft: number;

  equityPct?: number;
  lat: number;
  lng: number;
  tags?: string[];

  // New fields
  propertyType: PropertyType;
  yearBuilt?: number;
  lotSize?: number; // in sqft
  pricePerSqft?: number; // calculated or provided
  daysOnMarket?: number;
  image?: string; // placeholder for future image support
};

export type SortOption = "price-asc" | "price-desc" | "beds-desc" | "sqft-desc" | "equity-desc" | "newest" | "ppsqft-asc";

export type Filters = {
  // quick filters
  absentee?: boolean;
  highEquity?: boolean;
  vacant?: boolean;

  // form fields
  city?: string;
  minBeds?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  minSqft?: number;
};
