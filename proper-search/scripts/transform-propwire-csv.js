#!/usr/bin/env node
/**
 * Transform Propwire CSV export to match our properties table schema
 * 
 * Usage: node scripts/transform-propwire-csv.js input.csv output.csv
 */

const fs = require('fs');
const path = require('path');

// Parse CSV (simple parser, handles quoted fields)
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Detect if owner is absentee (mailing address different from property)
function isAbsentee(row) {
  const propCity = (row['City'] || '').toLowerCase().trim();
  const mailCity = (row['Owner Mailing City'] || '').toLowerCase().trim();
  const propZip = (row['Zip'] || '').trim();
  const mailZip = (row['Owner Mailing Zip'] || '').trim();
  
  if (!mailCity || !mailZip) return false;
  return propCity !== mailCity || propZip !== mailZip;
}

// Build tags array
function buildTags(row) {
  const tags = [];
  
  // Check vacant
  if (row['Vacant?'] === '1' || row['Vacant?']?.toLowerCase() === 'yes') {
    tags.push('vacant');
  }
  
  // Check absentee
  if (isAbsentee(row)) {
    tags.push('absentee');
  }
  
  return tags;
}

// Map property type
function mapPropertyType(propwireType) {
  const type = (propwireType || '').toLowerCase();
  if (type.includes('condo')) return 'condo';
  if (type.includes('townhouse') || type.includes('town house')) return 'townhouse';
  if (type.includes('multi') || type.includes('duplex') || type.includes('triplex')) return 'multi-family';
  if (type.includes('land') || type.includes('vacant lot')) return 'land';
  return 'house'; // default
}

// Transform a Propwire row to our schema
function transformRow(row) {
  const ownerFirst = row['Owner 1 First Name'] || '';
  const ownerLast = row['Owner 1 Last Name'] || '';
  const ownerName = [ownerFirst, ownerLast].filter(Boolean).join(' ').trim();
  
  return {
    address: row['Address'] || '',
    city: row['City'] || '',
    state: row['State'] || '',
    zip: row['Zip'] || '',
    price: '', // Will need to fill in manually or from another source
    beds: Math.round(parseFloat(row['Bedrooms']) || 0) || '',
    baths: parseFloat(row['Bathrooms']) || '',
    sqft: Math.round(parseFloat(row['Living Square Feet']) || 0) || '',
    equity_pct: '', // Not in Propwire data
    lat: '', // Will geocode later
    lng: '', // Will geocode later
    tags: `{${buildTags(row).join(',')}}`, // PostgreSQL array format
    property_type: mapPropertyType(row['Property Type']),
    year_built: Math.round(parseFloat(row['Year Built']) || 0) || '',
    lot_size: Math.round(parseFloat(row['Lot (Square Feet)']) || 0) || '',
    price_per_sqft: '',
    days_on_market: '',
    image: '',
    status: 'active',
    sold_date: '',
    sold_price: '',
    owner_name: ownerName,
    owner_mailing_address: row['Owner Mailing Address'] || '',
    owner_mailing_city: row['Owner Mailing City'] || '',
    owner_mailing_state: row['Owner Mailing State'] || '',
    owner_mailing_zip: row['Owner Mailing Zip'] || '',
    owner_occupied: row['Owner Occupied'] === '1' ? 'true' : 'false',
    vacant: row['Vacant?'] === '1' ? 'true' : 'false',
    ownership_months: Math.round(parseFloat(row['Ownership Length (Months)']) || 0) || '',
    county: row['County'] || '',
    apn: row['APN'] || '',
  };
}

// Generate CSV output
function toCSV(rows, headers) {
  const lines = [headers.join(',')];
  
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === undefined || val === null) return '';
      const str = String(val);
      // Quote if contains comma, newline, or quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

// Main
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node transform-propwire-csv.js <input.csv> <output.csv>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/transform-propwire-csv.js ~/Downloads/propwire-export.csv supabase/properties-import.csv');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1];
  
  console.log(`Reading: ${inputPath}`);
  const inputText = fs.readFileSync(inputPath, 'utf-8');
  const { rows: inputRows } = parseCSV(inputText);
  
  console.log(`Found ${inputRows.length} properties`);
  
  // Transform rows
  const transformedRows = inputRows.map(transformRow);
  
  // Count tags
  let absenteeCount = 0;
  let vacantCount = 0;
  transformedRows.forEach(r => {
    if (r.tags.includes('absentee')) absenteeCount++;
    if (r.tags.includes('vacant')) vacantCount++;
  });
  
  console.log(`  - ${absenteeCount} absentee owners`);
  console.log(`  - ${vacantCount} vacant properties`);
  
  // Output headers (matches our schema)
  const outputHeaders = [
    'address', 'city', 'state', 'zip', 'price', 'beds', 'baths', 'sqft',
    'equity_pct', 'lat', 'lng', 'tags', 'property_type', 'year_built',
    'lot_size', 'price_per_sqft', 'days_on_market', 'image', 'status',
    'sold_date', 'sold_price', 'owner_name', 'owner_mailing_address',
    'owner_mailing_city', 'owner_mailing_state', 'owner_mailing_zip',
    'owner_occupied', 'vacant', 'ownership_months', 'county', 'apn'
  ];
  
  const csvOutput = toCSV(transformedRows, outputHeaders);
  
  console.log(`Writing: ${outputPath}`);
  fs.writeFileSync(outputPath, csvOutput);
  
  console.log('Done! Next steps:');
  console.log('  1. Run the SQL migration in Supabase');
  console.log('  2. Import this CSV to the properties table');
  console.log('  3. Run the geocoding script to fill in lat/lng');
}

main();
