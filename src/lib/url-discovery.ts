/**
 * URL Discovery Service
 * Auto-discovers car listing URLs when user-provided URLs fail
 * Uses DuckDuckGo HTML scraping (no API key needed)
 */

import * as cheerio from 'cheerio';

export interface DiscoveredUrl {
  url: string;
  title: string;
  source: string;
}

const AUSTRALIAN_CAR_SITES = [
  'carsales.com.au',
  'gumtree.com.au',
  'autotrader.com.au',
  'carsguide.com.au',
  'drive.com.au',
  'pickles.com.au',
  'manheim.com.au',
  'graysauctions.com',
  'facebook.com/marketplace',
  'carfact.com.au',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function discoverCarListingUrls(
  year: number,
  make: string,
  model: string,
  maxUrls: number = 10
): Promise<DiscoveredUrl[]> {
  const discovered: DiscoveredUrl[] = [];
  const searchQuery = `${year} ${make} ${model} for sale Australia`;
  
  try {
    // Try DuckDuckGo HTML search
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract result links
      $('a.result__a').each((_, el) => {
        if (discovered.length >= maxUrls) return false;
        
        const href = $(el).attr('href');
        const title = $(el).text().trim();
        
        if (href) {
          // DuckDuckGo wraps URLs, extract the actual URL
          const urlMatch = href.match(/uddg=([^&]+)/);
          const actualUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : href;
          
          // Check if it's from a known car site
          const matchingSite = AUSTRALIAN_CAR_SITES.find(site => actualUrl.includes(site));
          if (matchingSite) {
            discovered.push({
              url: actualUrl,
              title,
              source: matchingSite,
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('DuckDuckGo search failed:', error);
  }
  
  // If DuckDuckGo fails or returns few results, generate site-specific search URLs
  if (discovered.length < maxUrls) {
    const siteSearchUrls = generateSiteSearchUrls(year, make, model);
    for (const siteUrl of siteSearchUrls) {
      if (discovered.length >= maxUrls) break;
      if (!discovered.some(d => d.url === siteUrl.url)) {
        discovered.push(siteUrl);
      }
    }
  }
  
  return discovered.slice(0, maxUrls);
}

function generateSiteSearchUrls(year: number, make: string, model: string): DiscoveredUrl[] {
  const makeSlug = make.toLowerCase().replace(/\s+/g, '-');
  const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
  const query = encodeURIComponent(`${year} ${make} ${model}`);
  
  return [
    {
      url: `https://www.carsales.com.au/cars/${makeSlug}/${modelSlug}/?q=${query}`,
      title: `${year} ${make} ${model} on Carsales`,
      source: 'carsales.com.au',
    },
    {
      url: `https://www.gumtree.com.au/s-cars-vans-utes/${makeSlug}+${modelSlug}/k0c18320?search=${query}`,
      title: `${year} ${make} ${model} on Gumtree`,
      source: 'gumtree.com.au',
    },
    {
      url: `https://www.autotrader.com.au/cars/${makeSlug}/${modelSlug}`,
      title: `${year} ${make} ${model} on AutoTrader`,
      source: 'autotrader.com.au',
    },
    {
      url: `https://www.carsguide.com.au/buy-a-car/${makeSlug}/${modelSlug}`,
      title: `${year} ${make} ${model} on CarsGuide`,
      source: 'carsguide.com.au',
    },
    {
      url: `https://www.drive.com.au/cars-for-sale/?make=${make}&model=${model}&year=${year}`,
      title: `${year} ${make} ${model} on Drive`,
      source: 'drive.com.au',
    },
    {
      url: `https://www.pickles.com.au/cars/search?q=${query}`,
      title: `${year} ${make} ${model} on Pickles Auctions`,
      source: 'pickles.com.au',
    },
  ];
}

export { AUSTRALIAN_CAR_SITES };
