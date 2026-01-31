import { createClient } from '@supabase/supabase-js';
import type { Filters, ResultItem } from '@/app/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

// Database row type (snake_case from Supabase)
export type PropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  equity_pct: number | null;
  lat: number;
  lng: number;
  tags: string[] | null;
  property_type: string;
  year_built: number | null;
  lot_size: number | null;
  price_per_sqft: number | null;
  days_on_market: number | null;
  image: string | null;
  status: 'active' | 'sold' | 'pending';
  sold_date: string | null;
  sold_price: number | null;
  created_at: string;
};

// Convert database row to ResultItem (camelCase for frontend)
export function rowToResultItem(row: PropertyRow): ResultItem {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    price: row.price,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    equityPct: row.equity_pct ?? undefined,
    lat: row.lat,
    lng: row.lng,
    tags: row.tags ?? undefined,
    propertyType: row.property_type as ResultItem['propertyType'],
    yearBuilt: row.year_built ?? undefined,
    lotSize: row.lot_size ?? undefined,
    pricePerSqft: row.price_per_sqft ?? undefined,
    daysOnMarket: row.days_on_market ?? undefined,
    image: row.image ?? undefined,
  };
}

// Extended result item with sold info for comps
export type CompItem = ResultItem & {
  soldDate?: string;
  soldPrice?: number;
  distance?: number; // miles from subject property
};

export function rowToCompItem(row: PropertyRow, subjectLat?: number, subjectLng?: number): CompItem {
  const item = rowToResultItem(row) as CompItem;
  item.soldDate = row.sold_date ?? undefined;
  item.soldPrice = row.sold_price ?? undefined;
  
  // Calculate distance if subject coordinates provided
  if (subjectLat !== undefined && subjectLng !== undefined) {
    item.distance = calculateDistance(subjectLat, subjectLng, row.lat, row.lng);
  }
  
  return item;
}

// Haversine formula to calculate distance between two points in miles
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Fetch unique cities for autocomplete
export async function fetchCitySuggestions(query: string): Promise<{ data: string[] | null; error: Error | null }> {
  try {
    if (!query || query.trim().length < 2) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('properties')
      .select('city, state')
      .ilike('city', `${query.trim()}%`)
      .eq('status', 'active')
      .limit(100);

    if (error) {
      console.error('Error fetching city suggestions:', error);
      return { data: null, error: new Error(error.message) };
    }

    // Get unique city/state combinations
    const uniqueCities = new Map<string, string>();
    (data || []).forEach((row: { city: string; state: string }) => {
      const key = `${row.city}, ${row.state}`;
      if (!uniqueCities.has(key)) {
        uniqueCities.set(key, key);
      }
    });

    return { data: Array.from(uniqueCities.values()).slice(0, 8), error: null };
  } catch (err) {
    console.error('Error fetching city suggestions:', err);
    return { data: null, error: err as Error };
  }
}

// Fetch properties with search and filters
export async function fetchProperties(params: {
  query?: string;
  filters?: Filters;
  bounds?: { north: number; south: number; east: number; west: number };
  limit?: number;
}): Promise<{ data: ResultItem[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'active');

    // Text search - search in city, zip, address
    if (params.query && params.query.trim()) {
      const q = params.query.trim().toLowerCase();
      // Use OR to search multiple columns
      query = query.or(`city.ilike.%${q}%,zip.ilike.%${q}%,address.ilike.%${q}%,state.ilike.%${q}%`);
    }

    // Apply filters
    if (params.filters) {
      const { city, minBeds, maxPrice, propertyType, minSqft, absentee, highEquity, vacant } = params.filters;
      
      if (city && city.trim()) {
        query = query.ilike('city', `%${city.trim()}%`);
      }
      if (typeof minBeds === 'number') {
        query = query.gte('beds', minBeds);
      }
      if (typeof maxPrice === 'number') {
        query = query.lte('price', maxPrice);
      }
      if (propertyType) {
        query = query.eq('property_type', propertyType);
      }
      if (typeof minSqft === 'number') {
        query = query.gte('sqft', minSqft);
      }
      
      // Tag filters - check if tag is in the tags array
      if (absentee) {
        query = query.contains('tags', ['absentee']);
      }
      if (highEquity) {
        query = query.contains('tags', ['highEquity']);
      }
      if (vacant) {
        query = query.contains('tags', ['vacant']);
      }
    }

    // Map bounds filtering
    if (params.bounds) {
      query = query
        .gte('lat', params.bounds.south)
        .lte('lat', params.bounds.north)
        .gte('lng', params.bounds.west)
        .lte('lng', params.bounds.east);
    }

    // Limit results
    query = query.limit(params.limit ?? 500);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return { data: null, error: new Error(error.message) };
    }

    const items = (data as PropertyRow[]).map(rowToResultItem);
    return { data: items, error: null };
  } catch (err) {
    console.error('Error fetching properties:', err);
    return { data: null, error: err as Error };
  }
}

// Fetch comparable sold properties near a subject property
export async function fetchComps(params: {
  property: ResultItem;
  radiusMiles?: number;
  sqftTolerance?: number; // percentage, e.g., 0.2 for 20%
  limit?: number;
}): Promise<{ data: CompItem[] | null; error: Error | null }> {
  try {
    const { property, radiusMiles = 0.5, sqftTolerance = 0.2, limit = 15 } = params;
    
    // Calculate lat/lng bounds for the radius
    const latDelta = radiusMiles / 69; // 1 degree lat ≈ 69 miles
    const lngDelta = radiusMiles / (69 * Math.cos(property.lat * Math.PI / 180));
    
    // Calculate sqft range
    const minSqft = Math.floor(property.sqft * (1 - sqftTolerance));
    const maxSqft = Math.ceil(property.sqft * (1 + sqftTolerance));

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'sold')
      .gte('lat', property.lat - latDelta)
      .lte('lat', property.lat + latDelta)
      .gte('lng', property.lng - lngDelta)
      .lte('lng', property.lng + lngDelta)
      .gte('sqft', minSqft)
      .lte('sqft', maxSqft)
      .order('sold_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching comps:', error);
      return { data: null, error: new Error(error.message) };
    }

    const items = (data as PropertyRow[]).map(row => 
      rowToCompItem(row, property.lat, property.lng)
    );
    
    // Sort by distance
    items.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    
    return { data: items, error: null };
  } catch (err) {
    console.error('Error fetching comps:', err);
    return { data: null, error: err as Error };
  }
}

// Calculate ARV (After Repair Value) from comps
export function calculateARV(subjectSqft: number, comps: CompItem[]): {
  avgPricePerSqft: number;
  medianPricePerSqft: number;
  estimatedARV: number;
  compCount: number;
} | null {
  if (!comps || comps.length === 0) return null;
  
  // Calculate price per sqft for each comp
  const pricesPerSqft = comps
    .filter(c => c.soldPrice && c.sqft > 0)
    .map(c => (c.soldPrice ?? 0) / c.sqft);
  
  if (pricesPerSqft.length === 0) return null;
  
  // Average
  const avgPricePerSqft = pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length;
  
  // Median
  const sorted = [...pricesPerSqft].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianPricePerSqft = sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
  
  // Estimated ARV using average $/sqft
  const estimatedARV = Math.round(subjectSqft * avgPricePerSqft);
  
  return {
    avgPricePerSqft: Math.round(avgPricePerSqft),
    medianPricePerSqft: Math.round(medianPricePerSqft),
    estimatedARV,
    compCount: pricesPerSqft.length,
  };
}
