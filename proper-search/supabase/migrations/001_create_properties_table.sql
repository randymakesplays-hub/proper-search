-- Create properties table matching ResultItem type + comps fields
-- lat/lng are nullable so we can import first, then geocode
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  price INTEGER,  -- nullable, can fill in later
  beds INTEGER,
  baths NUMERIC(3,1),
  sqft INTEGER,
  equity_pct INTEGER,
  lat NUMERIC(10,7),  -- nullable, will geocode after import
  lng NUMERIC(10,7),  -- nullable, will geocode after import
  tags TEXT[] DEFAULT '{}',
  property_type TEXT DEFAULT 'house',
  year_built INTEGER,
  lot_size INTEGER,
  price_per_sqft INTEGER,
  days_on_market INTEGER,
  image TEXT,
  -- Comps fields
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending')),
  sold_date DATE,
  sold_price INTEGER,
  -- Owner info (from Propwire)
  owner_name TEXT,
  owner_mailing_address TEXT,
  owner_mailing_city TEXT,
  owner_mailing_state TEXT,
  owner_mailing_zip TEXT,
  owner_occupied BOOLEAN,
  vacant BOOLEAN,
  ownership_months INTEGER,
  county TEXT,
  apn TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON properties(lat, lng);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_beds ON properties(beds);
CREATE INDEX IF NOT EXISTS idx_properties_sqft ON properties(sqft);
CREATE INDEX IF NOT EXISTS idx_properties_needs_geocode ON properties(lat) WHERE lat IS NULL;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust as needed for your auth model)
CREATE POLICY "Allow public read access" ON properties
  FOR SELECT USING (true);

-- Allow authenticated users to update (for geocoding script)
CREATE POLICY "Allow updates" ON properties
  FOR UPDATE USING (true);

-- Comment explaining the table
COMMENT ON TABLE properties IS 'Real estate properties for search and comps analysis';
COMMENT ON COLUMN properties.status IS 'Property status: active (on market), sold, or pending';
COMMENT ON COLUMN properties.lat IS 'Latitude - null until geocoded';
COMMENT ON COLUMN properties.lng IS 'Longitude - null until geocoded';
COMMENT ON COLUMN properties.tags IS 'Property tags like absentee, highEquity, vacant';
