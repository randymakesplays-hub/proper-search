export type Filters = {
    city: string;
    minBeds?: number;
    maxPrice?: number;
    flags: {
      absentee: boolean;
      highEquity: boolean;
      vacant: boolean;
    };
  };
  
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
    equityPct: number | null;
  
    lat: number;
    lng: number;
  
    tags?: string[];
  };
  