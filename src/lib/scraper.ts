/**
 * Web Scraping Service
 * Scrapes car listing data from provided URLs with 500ms staggered requests
 */

import * as cheerio from 'cheerio';

export interface ScrapedListing {
  url: string;
  source: string;
  status: 'success' | 'blocked' | 'error' | 'auto-discovered';
  title?: string;
  price?: number;
  year?: number;
  make?: string;
  model?: string;
  odometer?: number;
  transmission?: string;
  fuelType?: string;
  location?: string;
  imageUrl?: string;
  error?: string;
}

export interface ScrapeResult {
  listings: ScrapedListing[];
  successCount: number;
  blockedCount: number;
  errorCount: number;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parsePrice(priceStr: string | undefined): number | undefined {
  if (!priceStr) return undefined;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? undefined : price;
}

function parseOdometer(odometerStr: string | undefined): number | undefined {
  if (!odometerStr) return undefined;
  const cleaned = odometerStr.replace(/[^0-9]/g, '');
  const odometer = parseInt(cleaned, 10);
  return isNaN(odometer) ? undefined : odometer;
}

function parseYear(yearStr: string | undefined): number | undefined {
  if (!yearStr) return undefined;
  const match = yearStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : undefined;
}

function genericParser(html: string): Partial<ScrapedListing> {
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim() || $('[class*="title"]').first().text().trim();
  
  let price: number | undefined;
  for (const sel of ['[class*="price"]', '[class*="amount"]', '[itemprop="price"]']) {
    price = parsePrice($(sel).first().text());
    if (price) break;
  }
  
  let odometer: number | undefined;
  for (const sel of ['[class*="odometer"]', '[class*="km"]', '[class*="mileage"]']) {
    odometer = parseOdometer($(sel).first().text());
    if (odometer) break;
  }
  
  return { title, price, odometer, year: parseYear(title) };
}

async function scrapeSingleUrl(url: string): Promise<ScrapedListing> {
  const domain = extractDomain(url);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 403 || response.status === 429) {
      return { url, source: domain, status: 'blocked', error: `Access denied (${response.status})` };
    }
    
    if (!response.ok) {
      return { url, source: domain, status: 'error', error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    const lowerHtml = html.toLowerCase();
    
    if (lowerHtml.includes('captcha') || lowerHtml.includes('robot') || lowerHtml.includes('blocked')) {
      return { url, source: domain, status: 'blocked', error: 'Bot detection triggered' };
    }
    
    const parsed = genericParser(html);
    
    if (!parsed.title && !parsed.price) {
      return { url, source: domain, status: 'error', error: 'Could not extract listing data' };
    }
    
    return { url, source: domain, status: 'success', ...parsed };
  } catch (error: any) {
    return { url, source: domain, status: 'error', error: error.message || 'Unknown error' };
  }
}

export async function scrapeUrls(urls: string[]): Promise<ScrapeResult> {
  const listings: ScrapedListing[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]?.trim();
    if (!url) continue;
    if (i > 0) await delay(500); // 500ms stagger
    listings.push(await scrapeSingleUrl(url));
  }
  
  return {
    listings,
    successCount: listings.filter(l => l.status === 'success').length,
    blockedCount: listings.filter(l => l.status === 'blocked').length,
    errorCount: listings.filter(l => l.status === 'error').length,
  };
}

export function shouldDiscoverMoreUrls(result: ScrapeResult): boolean {
  if (result.listings.length === 0) return true;
  const failedCount = result.blockedCount + result.errorCount;
  return failedCount / result.listings.length > 0.5;
}
