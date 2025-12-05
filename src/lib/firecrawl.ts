import FirecrawlApp from '@mendable/firecrawl-js';

// Lazy initialization of Firecrawl to ensure env vars are loaded in serverless
let firecrawlInstance: FirecrawlApp | null = null;

function getFirecrawl(): FirecrawlApp {
  if (!firecrawlInstance) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }
    firecrawlInstance = new FirecrawlApp({ apiKey });
  }
  return firecrawlInstance;
}

// Check if Firecrawl is properly configured
export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY && process.env.FIRECRAWL_API_KEY !== 'your-firecrawl-api-key-here';
}

export interface CarListingData {
  url: string;
  title?: string;
  price?: number;
  currency?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  mileageUnit?: string;
  location?: string;
  seller?: string;
  sellerType?: 'dealer' | 'private' | 'unknown';
  description?: string;
  features?: string[];
  images?: string[];
  condition?: string;
  transmission?: string;
  fuelType?: string;
  bodyType?: string;
  color?: string;
  vin?: string;
  listingDate?: string;
  rawContent?: string;
  scrapedAt: string;
  success: boolean;
  error?: string;
}

export interface ScrapingResult {
  success: boolean;
  listings: CarListingData[];
  failedUrls: { url: string; error: string }[];
  totalScraped: number;
  totalFailed: number;
}

// Car listing extraction schema for structured data
const carListingSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Full listing title' },
    price: { type: 'number', description: 'Vehicle price as a number (no currency symbols)' },
    currency: { type: 'string', description: 'Currency code (AUD, USD, etc.)' },
    make: { type: 'string', description: 'Vehicle manufacturer (Toyota, Ford, etc.)' },
    model: { type: 'string', description: 'Vehicle model name' },
    year: { type: 'number', description: 'Year of manufacture' },
    mileage: { type: 'number', description: 'Odometer reading as a number' },
    mileageUnit: { type: 'string', description: 'km or miles' },
    location: { type: 'string', description: 'Seller location/city' },
    seller: { type: 'string', description: 'Seller name or dealership' },
    sellerType: { type: 'string', enum: ['dealer', 'private', 'unknown'], description: 'Type of seller' },
    description: { type: 'string', description: 'Full vehicle description' },
    features: { type: 'array', items: { type: 'string' }, description: 'List of features' },
    images: { type: 'array', items: { type: 'string' }, description: 'Image URLs' },
    condition: { type: 'string', description: 'Vehicle condition (new, used, certified)' },
    transmission: { type: 'string', description: 'Manual, Automatic, CVT, etc.' },
    fuelType: { type: 'string', description: 'Petrol, Diesel, Electric, Hybrid, etc.' },
    bodyType: { type: 'string', description: 'Sedan, SUV, Hatchback, Ute, etc.' },
    color: { type: 'string', description: 'Exterior color' },
    vin: { type: 'string', description: 'Vehicle Identification Number if available' },
    listingDate: { type: 'string', description: 'When the listing was posted' },
  },
  required: ['title'],
};

/**
 * Parse car listing data from scraped markdown content
 */
function parseCarListingFromMarkdown(markdown: string): Partial<CarListingData> {
  const data: Partial<CarListingData> = {};
  
  // Extract price - look for dollar amounts
  const priceMatch = markdown.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
  if (priceMatch) {
    data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    data.currency = 'AUD';
  }
  
  // Extract year - look for 4-digit year typically 1990-2025
  const yearMatch = markdown.match(/\b(19[9][0-9]|20[0-2][0-9])\b/);
  if (yearMatch) {
    data.year = parseInt(yearMatch[1]);
  }
  
  // Extract mileage/odometer
  const mileageMatch = markdown.match(/([\d,]+)\s*(?:km|kms|kilometres|kilometers)/i);
  if (mileageMatch) {
    data.mileage = parseInt(mileageMatch[1].replace(/,/g, ''));
    data.mileageUnit = 'km';
  }
  
  // Extract transmission
  if (/automatic|auto\b/i.test(markdown)) {
    data.transmission = 'Automatic';
  } else if (/manual/i.test(markdown)) {
    data.transmission = 'Manual';
  } else if (/cvt/i.test(markdown)) {
    data.transmission = 'CVT';
  }
  
  // Extract fuel type
  if (/petrol|gasoline/i.test(markdown)) {
    data.fuelType = 'Petrol';
  } else if (/diesel/i.test(markdown)) {
    data.fuelType = 'Diesel';
  } else if (/electric\b/i.test(markdown)) {
    data.fuelType = 'Electric';
  } else if (/hybrid/i.test(markdown)) {
    data.fuelType = 'Hybrid';
  }
  
  // Extract body type
  if (/\bsuv\b/i.test(markdown)) {
    data.bodyType = 'SUV';
  } else if (/\bsedan\b/i.test(markdown)) {
    data.bodyType = 'Sedan';
  } else if (/\bhatchback\b|\bhatch\b/i.test(markdown)) {
    data.bodyType = 'Hatchback';
  } else if (/\bute\b|\bpickup\b/i.test(markdown)) {
    data.bodyType = 'Ute';
  } else if (/\bwagon\b/i.test(markdown)) {
    data.bodyType = 'Wagon';
  }
  
  // Extract seller type
  if (/dealer|dealership/i.test(markdown)) {
    data.sellerType = 'dealer';
  } else if (/private\s*(?:seller|sale)/i.test(markdown)) {
    data.sellerType = 'private';
  }
  
  // Extract condition
  if (/\bnew\b/i.test(markdown) && !/used/i.test(markdown)) {
    data.condition = 'New';
  } else if (/used|pre-owned|second[\s-]*hand/i.test(markdown)) {
    data.condition = 'Used';
  }
  
  // Try to extract title from first heading or bold text
  const titleMatch = markdown.match(/^#\s*(.+)$/m) || markdown.match(/\*\*(.+?)\*\*/);
  if (titleMatch) {
    data.title = titleMatch[1].substring(0, 200);
  }
  
  // Extract location - common Australian cities/states
  const locationMatch = markdown.match(/\b(Sydney|Melbourne|Brisbane|Perth|Adelaide|Hobart|Darwin|Canberra|NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\b/i);
  if (locationMatch) {
    data.location = locationMatch[1];
  }
  
  return data;
}

/**
 * Scrape a single car listing URL with Firecrawl
 * Handles JS-heavy sites, anti-bot protection, and dynamic content
 */
export async function scrapeCarListing(url: string): Promise<CarListingData> {
  const startTime = Date.now();
  
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      throw new Error('Invalid URL protocol');
    }

    // Check if Firecrawl is configured
    if (!isFirecrawlConfigured()) {
      throw new Error('Firecrawl API key not configured');
    }

    console.log(`[Firecrawl] Scraping: ${url}`);

    // Get the Firecrawl instance (lazy initialization)
    const firecrawl = getFirecrawl();

    // Use Firecrawl's scrape method (v4.x SDK)
    const response = await (firecrawl as any).scrapeUrl(url, {
      formats: ['markdown'],
      waitFor: 3000,
      timeout: 30000,
      onlyMainContent: true,
    });

    if (!response) {
      throw new Error('No response from Firecrawl');
    }

    // Check for blocked/error responses (handle both v1 and v2 SDK formats)
    if (response.error || !response.success) {
      throw new Error(response.error || 'Firecrawl returned unsuccessful response');
    }

    const markdown = response.markdown || response.content || response.html || '';
    
    if (!markdown || markdown.length < 50) {
      throw new Error('Insufficient content scraped - site may be blocking');
    }

    // Parse the markdown content to extract car listing data
    const extractedData = parseCarListingFromMarkdown(markdown);

    const listing: CarListingData = {
      url,
      title: extractedData.title || response.metadata?.title || 'Unknown Listing',
      price: extractedData.price ? Number(extractedData.price) : undefined,
      currency: extractedData.currency || 'AUD',
      make: extractedData.make,
      model: extractedData.model,
      year: extractedData.year ? Number(extractedData.year) : undefined,
      mileage: extractedData.mileage ? Number(extractedData.mileage) : undefined,
      mileageUnit: extractedData.mileageUnit || 'km',
      location: extractedData.location,
      seller: extractedData.seller,
      sellerType: extractedData.sellerType || 'unknown',
      description: extractedData.description,
      features: extractedData.features || [],
      images: extractedData.images || [],
      condition: extractedData.condition,
      transmission: extractedData.transmission,
      fuelType: extractedData.fuelType,
      bodyType: extractedData.bodyType,
      color: extractedData.color,
      vin: extractedData.vin,
      listingDate: extractedData.listingDate,
      rawContent: markdown.substring(0, 5000), // Limit raw content size
      scrapedAt: new Date().toISOString(),
      success: true,
    };

    const elapsed = Date.now() - startTime;
    console.log(`[Firecrawl] Successfully scraped ${url} in ${elapsed}ms`);

    return listing;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Firecrawl] Failed to scrape ${url} after ${elapsed}ms:`, errorMessage);

    return {
      url,
      scrapedAt: new Date().toISOString(),
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch scrape multiple car listing URLs
 * Processes URLs concurrently with rate limiting
 */
export async function scrapeMultipleListings(
  urls: string[],
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<ScrapingResult> {
  const { concurrency = 3, onProgress } = options;
  const validUrls = urls.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return {
      success: false,
      listings: [],
      failedUrls: urls.map((url) => ({ url, error: 'Invalid URL' })),
      totalScraped: 0,
      totalFailed: urls.length,
    };
  }

  const listings: CarListingData[] = [];
  const failedUrls: { url: string; error: string }[] = [];

  // Process URLs in batches to respect rate limits
  for (let i = 0; i < validUrls.length; i += concurrency) {
    const batch = validUrls.slice(i, i + concurrency);
    
    const results = await Promise.all(
      batch.map((url) => scrapeCarListing(url))
    );

    for (const result of results) {
      if (result.success) {
        listings.push(result);
      } else {
        failedUrls.push({ url: result.url, error: result.error || 'Unknown error' });
      }
    }

    onProgress?.(Math.min(i + concurrency, validUrls.length), validUrls.length);

    // Add delay between batches to avoid rate limiting
    if (i + concurrency < validUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Add any initially invalid URLs to failed list
  const invalidUrls = urls.filter((url) => !validUrls.includes(url));
  for (const url of invalidUrls) {
    failedUrls.push({ url, error: 'Invalid URL format' });
  }

  return {
    success: listings.length > 0,
    listings,
    failedUrls,
    totalScraped: listings.length,
    totalFailed: failedUrls.length,
  };
}

/**
 * Format scraped listings for LLM analysis
 * Returns clean markdown suitable for AI processing
 */
export function formatListingsForAI(listings: CarListingData[]): string {
  if (listings.length === 0) {
    return 'No listings were successfully scraped.';
  }

  let markdown = `# Scraped Car Listings (${listings.length} total)\n\n`;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    markdown += `## Listing ${i + 1}: ${listing.title || 'Unknown'}\n\n`;
    markdown += `**URL:** ${listing.url}\n`;
    
    if (listing.price) {
      markdown += `**Price:** ${listing.currency || '$'}${listing.price.toLocaleString()}\n`;
    }
    
    if (listing.year || listing.make || listing.model) {
      markdown += `**Vehicle:** ${[listing.year, listing.make, listing.model].filter(Boolean).join(' ')}\n`;
    }
    
    if (listing.mileage) {
      markdown += `**Mileage:** ${listing.mileage.toLocaleString()} ${listing.mileageUnit || 'km'}\n`;
    }
    
    if (listing.condition) markdown += `**Condition:** ${listing.condition}\n`;
    if (listing.transmission) markdown += `**Transmission:** ${listing.transmission}\n`;
    if (listing.fuelType) markdown += `**Fuel Type:** ${listing.fuelType}\n`;
    if (listing.bodyType) markdown += `**Body Type:** ${listing.bodyType}\n`;
    if (listing.color) markdown += `**Color:** ${listing.color}\n`;
    if (listing.location) markdown += `**Location:** ${listing.location}\n`;
    if (listing.seller) markdown += `**Seller:** ${listing.seller} (${listing.sellerType})\n`;
    
    if (listing.features && listing.features.length > 0) {
      markdown += `**Features:** ${listing.features.join(', ')}\n`;
    }
    
    if (listing.description) {
      markdown += `\n**Description:**\n${listing.description.substring(0, 500)}${listing.description.length > 500 ? '...' : ''}\n`;
    }
    
    markdown += `\n---\n\n`;
  }

  return markdown;
}

/**
 * Extract key metrics from scraped listings for comparison
 */
export function extractListingMetrics(listings: CarListingData[]) {
  const validListings = listings.filter((l) => l.success && l.price);
  
  if (validListings.length === 0) {
    return null;
  }

  const prices = validListings.map((l) => l.price!).sort((a, b) => a - b);
  const mileages = validListings.filter((l) => l.mileage).map((l) => l.mileage!);
  const years = validListings.filter((l) => l.year).map((l) => l.year!);

  return {
    count: validListings.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      median: prices[Math.floor(prices.length / 2)],
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    },
    mileageRange: mileages.length > 0 ? {
      min: Math.min(...mileages),
      max: Math.max(...mileages),
      average: Math.round(mileages.reduce((a, b) => a + b, 0) / mileages.length),
    } : null,
    yearRange: years.length > 0 ? {
      min: Math.min(...years),
      max: Math.max(...years),
    } : null,
    sellerTypes: {
      dealer: validListings.filter((l) => l.sellerType === 'dealer').length,
      private: validListings.filter((l) => l.sellerType === 'private').length,
      unknown: validListings.filter((l) => l.sellerType === 'unknown').length,
    },
    locations: [...new Set(validListings.map((l) => l.location).filter(Boolean))],
  };
}
