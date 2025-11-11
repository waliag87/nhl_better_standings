/**
 * Build Orchestration Script
 * Main entry point for the NHL Standings website build process
 * 
 * This script orchestrates the entire build pipeline:
 * 1. Fetch current NHL data from API (with retry logic and fallback to cache)
 * 2. Process standings and calculate playoff positions
 * 3. Generate static site files
 * 
 * Error Handling:
 * - If API fetch fails after retries, falls back to cached data
 * - Stale data is flagged and triggers a warning banner on the site
 * - If build fails completely, exits with error code to preserve previous site version
 * - All errors are logged to console for GitHub Actions visibility
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fetchNHLData } from './fetchData.js';
import { processStandings } from './processStandings.js';
import { generateSite } from './generateSite.js';

/**
 * Main build function that orchestrates the entire pipeline
 */
async function build(): Promise<void> {
  console.log('='.repeat(60));
  console.log('NHL Standings Website - Build Process');
  console.log('='.repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // Step 1: Fetch NHL data
    console.log('Step 1: Fetching NHL data...');
    console.log('-'.repeat(60));
    const fetchResult = await fetchNHLData();
    
    if (fetchResult.isStale) {
      console.warn('⚠ WARNING: Using stale cached data');
      console.warn(`  Cache timestamp: ${fetchResult.cacheTimestamp}`);
    }
    
    console.log('✓ Data fetch complete');
    console.log();

    // Step 2: Process standings
    console.log('Step 2: Processing standings...');
    console.log('-'.repeat(60));
    const processedStandings = processStandings(fetchResult.data);
    
    // Add stale data flag to processed standings
    if (fetchResult.isStale) {
      processedStandings.isStaleData = true;
      processedStandings.cacheTimestamp = fetchResult.cacheTimestamp;
    }
    
    console.log(`✓ Processed ${fetchResult.data.standings.length} teams`);
    console.log(`✓ Eastern Conference: ${Object.keys(processedStandings.eastern.divisions).length} divisions`);
    console.log(`✓ Western Conference: ${Object.keys(processedStandings.western.divisions).length} divisions`);
    console.log(`✓ Wild Cards: ${processedStandings.eastern.wildCards.length + processedStandings.western.wildCards.length} teams`);
    console.log();

    // Step 3: Generate static site
    console.log('Step 3: Generating static site...');
    console.log('-'.repeat(60));
    generateSite(processedStandings);
    console.log();

    // Build complete
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('='.repeat(60));
    console.log(`✓ Build completed successfully in ${duration}s`);
    console.log('='.repeat(60));
    
  } catch (error) {
    // Error handling for entire pipeline
    console.error();
    console.error('='.repeat(60));
    console.error('✗ Build failed');
    console.error('='.repeat(60));
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error();
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    console.error();
    console.error('Build process terminated with errors.');
    console.error('Previous site version will be preserved (if it exists).');
    console.error();
    console.error('This error will be visible in GitHub Actions logs for debugging.');
    
    // Exit with error code
    // Note: By exiting with error code, GitHub Actions will not overwrite
    // the existing deployed site, preserving the previous version
    process.exit(1);
  }
}

// Execute build if this script is run directly
// In ES modules, we check if the file is being run directly using import.meta.url
const __filename = fileURLToPath(import.meta.url);

// Check if this is the main module
if (process.argv[1] === __filename || process.argv[1] === __filename.replace(/\.ts$/, '.js')) {
  build();
}

export { build };
