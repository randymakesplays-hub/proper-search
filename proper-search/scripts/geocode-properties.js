#!/usr/bin/env node
/**
 * Geocode properties that are missing lat/lng coordinates
 * 
 * Usage: 
 *   GOOGLE_GEOCODE_KEY=your_key node scripts/geocode-properties.js
 * 
 * Or set in .env.local and run:
 *   node -r dotenv/config scripts/geocode-properties.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_GEOCODE_KEY = process.env.GOOGLE_GEOCODE_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Rate limiting - Google allows 50 requests/second, we'll be conservative
const REQUESTS_PER_SECOND = 10;
const DELAY_MS = 1000 / REQUESTS_PER_SECOND;

// Batch size for fetching rows
const BATCH_SIZE = 100;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

if (!GOOGLE_GEOCODE_KEY) {
  console.error('Error: Missing Google Geocoding API key');
  console.error('Set GOOGLE_GEOCODE_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geocode an address using Google Geocoding API
async function geocodeAddress(address, city, state, zip) {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_GEOCODE_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted: data.results[0].formatted_address,
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`  No results for: ${fullAddress}`);
      return null;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('  Rate limited by Google! Waiting 60 seconds...');
      await sleep(60000);
      return geocodeAddress(address, city, state, zip); // Retry
    } else {
      console.error(`  Geocode error: ${data.status} - ${data.error_message || ''}`);
      return null;
    }
  } catch (error) {
    console.error(`  Fetch error: ${error.message}`);
    return null;
  }
}

// Get count of properties needing geocoding
async function getUncodedCount() {
  const { count, error } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .is('lat', null);
  
  if (error) {
    console.error('Error getting count:', error);
    return 0;
  }
  return count || 0;
}

// Get a batch of properties needing geocoding
async function getUncodedBatch(limit = BATCH_SIZE) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, address, city, state, zip')
    .is('lat', null)
    .limit(limit);
  
  if (error) {
    console.error('Error fetching batch:', error);
    return [];
  }
  return data || [];
}

// Update a property with coordinates
async function updateCoordinates(id, lat, lng) {
  const { error } = await supabase
    .from('properties')
    .update({ lat, lng })
    .eq('id', id);
  
  if (error) {
    console.error(`Error updating ${id}:`, error);
    return false;
  }
  return true;
}

// Main geocoding loop
async function main() {
  console.log('=== Property Geocoder ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Google API Key: ${GOOGLE_GEOCODE_KEY.slice(0, 10)}...`);
  console.log('');
  
  // Get initial count
  const totalCount = await getUncodedCount();
  
  if (totalCount === 0) {
    console.log('All properties already have coordinates!');
    return;
  }
  
  console.log(`Found ${totalCount} properties needing geocoding\n`);
  console.log(`Rate: ${REQUESTS_PER_SECOND} requests/second`);
  console.log(`Estimated time: ~${Math.ceil(totalCount / REQUESTS_PER_SECOND / 60)} minutes\n`);
  
  let processed = 0;
  let success = 0;
  let failed = 0;
  
  while (true) {
    // Get batch
    const batch = await getUncodedBatch();
    
    if (batch.length === 0) {
      break; // No more to process
    }
    
    for (const property of batch) {
      processed++;
      const progress = `[${processed}/${totalCount}]`;
      
      process.stdout.write(`${progress} Geocoding: ${property.address}, ${property.city}...`);
      
      const result = await geocodeAddress(
        property.address,
        property.city,
        property.state,
        property.zip
      );
      
      if (result) {
        const updated = await updateCoordinates(property.id, result.lat, result.lng);
        if (updated) {
          success++;
          console.log(` OK (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
        } else {
          failed++;
          console.log(' UPDATE FAILED');
        }
      } else {
        failed++;
        console.log(' NOT FOUND');
      }
      
      // Rate limiting
      await sleep(DELAY_MS);
    }
  }
  
  console.log('\n=== Complete ===');
  console.log(`Processed: ${processed}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  
  // Check remaining
  const remaining = await getUncodedCount();
  if (remaining > 0) {
    console.log(`\nNote: ${remaining} properties still need coordinates (addresses not found)`);
  }
}

main().catch(console.error);
