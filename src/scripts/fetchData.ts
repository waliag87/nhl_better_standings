import * as fs from 'fs';
import * as path from 'path';
import { NHLApiResponse } from '../types/nhl.js';
import { validateNHLApiResponse, formatValidationErrors } from '../utils/validation.js';

const NHL_API_URL = 'https://api-web.nhle.com/v1/standings/now';
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'nhl-standings.json');
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Result of fetching NHL data, including whether cached data was used
 */
export interface FetchResult {
  data: NHLApiResponse;
  isStale: boolean;
  cacheTimestamp?: string;
}

/**
 * Fetches current NHL standings data from the NHL API
 * Implements retry logic with exponential backoff and file system caching
 * 
 * @returns Promise resolving to NHL API response data and metadata
 * @throws Error if all retry attempts fail and no cached data is available
 */
export async function fetchNHLData(): Promise<FetchResult> {
  let lastError: Error | null = null;

  // Attempt to fetch with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching NHL data (attempt ${attempt}/${MAX_RETRIES})...`);
      
      const response = await fetch(NHL_API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: NHLApiResponse = await response.json();
      
      // Validate response structure and data
      const validationResult = validateNHLApiResponse(data);
      
      if (!validationResult.isValid) {
        const errorMessage = formatValidationErrors(validationResult.errors);
        console.error('API response validation failed:');
        console.error(errorMessage);
        throw new Error('Invalid API response: validation failed');
      }
      
      console.log(`Successfully fetched and validated data for ${data.standings.length} teams`);
      
      // Cache the successful response
      await cacheResponse(data);
      
      return {
        data,
        isStale: false
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      // If not the last attempt, wait before retrying with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }
  
  // All retries failed, attempt to use cached data
  console.warn('All fetch attempts failed, attempting to use cached data...');
  console.error('Last error:', lastError?.message);
  
  try {
    const cachedResult = await loadCachedData();
    console.log('Successfully loaded cached data');
    console.warn('⚠ WARNING: Using stale cached data due to API fetch failure');
    return cachedResult;
  } catch (cacheError) {
    console.error('Failed to load cached data:', cacheError);
    throw new Error(
      `Failed to fetch NHL data after ${MAX_RETRIES} attempts and no cached data available. Last error: ${lastError?.message}`
    );
  }
}

/**
 * Caches the API response to the file system
 * 
 * @param data - NHL API response data to cache
 */
async function cacheResponse(data: NHLApiResponse): Promise<void> {
  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    
    const cacheData = {
      data,
      timestamp: new Date().toISOString(),
    };
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('Data cached successfully');
  } catch (error) {
    console.error('Failed to cache data:', error);
    // Don't throw - caching failure shouldn't break the fetch
  }
}

/**
 * Loads cached data from the file system
 * 
 * @returns Promise resolving to cached NHL API response data with metadata
 * @throws Error if cache file doesn't exist or is invalid
 */
async function loadCachedData(): Promise<FetchResult> {
  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error('No cached data available');
  }
  
  const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
  const cacheData = JSON.parse(cacheContent);
  
  if (!cacheData.data || !cacheData.data.standings) {
    throw new Error('Invalid cached data format');
  }
  
  // Validate cached data
  const validationResult = validateNHLApiResponse(cacheData.data);
  
  if (!validationResult.isValid) {
    const errorMessage = formatValidationErrors(validationResult.errors);
    console.error('Cached data validation failed:');
    console.error(errorMessage);
    throw new Error('Invalid cached data: validation failed');
  }
  
  console.log(`Using cached data from ${cacheData.timestamp}`);
  
  return {
    data: cacheData.data,
    isStale: true,
    cacheTimestamp: cacheData.timestamp
  };
}

/**
 * Sleep utility for retry delays
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
