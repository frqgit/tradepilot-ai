import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  scrapeMultipleListings, 
  formatListingsForAI, 
  extractListingMetrics,
  CarListingData,
  ScrapingResult 
} from '@/lib/firecrawl';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScrapeAndAnalyzeRequest {
  urls: string[];
  vehicleContext?: {
    make?: string;
    model?: string;
    year?: number;
    askingPrice?: number;
  };
}

interface AnalysisResult {
  scraping: ScrapingResult;
  metrics: ReturnType<typeof extractListingMetrics>;
  aiAnalysis: {
    summary: string;
    marketPosition: string;
    priceRecommendation: {
      fairMarketValue: number;
      buyPrice: number;
      sellPrice: number;
      confidence: string;
    };
    opportunities: string[];
    risks: string[];
    negotiationTips: string[];
    competitorInsights: string[];
  } | null;
}

// POST /api/scrape - Scrape URLs and analyze with AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Firecrawl API key is configured
    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured. Please add FIRECRAWL_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const body: ScrapeAndAnalyzeRequest = await request.json();
    const { urls, vehicleContext } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one URL to scrape' },
        { status: 400 }
      );
    }

    if (urls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 URLs allowed per request' },
        { status: 400 }
      );
    }

    console.log(`[Scrape API] Starting scrape of ${urls.length} URLs for user ${session.user.id}`);

    // Scrape all URLs using Firecrawl
    const scrapingResult = await scrapeMultipleListings(urls, {
      concurrency: 3,
      onProgress: (completed, total) => {
        console.log(`[Scrape API] Progress: ${completed}/${total}`);
      },
    });

    console.log(`[Scrape API] Scraping complete: ${scrapingResult.totalScraped} success, ${scrapingResult.totalFailed} failed`);

    // Extract metrics from scraped data
    const metrics = extractListingMetrics(scrapingResult.listings);

    // If we have scraped data, analyze with AI
    let aiAnalysis = null;
    if (scrapingResult.listings.length > 0 && process.env.OPENAI_API_KEY) {
      const formattedListings = formatListingsForAI(scrapingResult.listings);
      
      const contextInfo = vehicleContext 
        ? `\n\nUser is evaluating: ${[vehicleContext.year, vehicleContext.make, vehicleContext.model].filter(Boolean).join(' ')}${vehicleContext.askingPrice ? ` with asking price of $${vehicleContext.askingPrice.toLocaleString()}` : ''}`
        : '';

      const metricsInfo = metrics 
        ? `\n\nMarket Metrics Summary:
- ${metrics.count} comparable listings found
- Price Range: $${metrics.priceRange.min.toLocaleString()} - $${metrics.priceRange.max.toLocaleString()}
- Average Price: $${metrics.priceRange.average.toLocaleString()}
- Median Price: $${metrics.priceRange.median.toLocaleString()}
${metrics.mileageRange ? `- Mileage Range: ${metrics.mileageRange.min.toLocaleString()} - ${metrics.mileageRange.max.toLocaleString()} km` : ''}
${metrics.yearRange ? `- Year Range: ${metrics.yearRange.min} - ${metrics.yearRange.max}` : ''}
- Sellers: ${metrics.sellerTypes.dealer} dealers, ${metrics.sellerTypes.private} private`
        : '';

      const prompt = `You are an expert car market analyst helping car traders make profitable decisions. Analyze these scraped car listings and provide actionable insights.

${formattedListings}
${metricsInfo}
${contextInfo}

Provide a comprehensive analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence market overview",
  "marketPosition": "How this vehicle segment is performing (hot/stable/declining)",
  "priceRecommendation": {
    "fairMarketValue": <number - estimated fair market value based on scraped data>,
    "buyPrice": <number - maximum price to pay for a good deal>,
    "sellPrice": <number - optimal selling price for quick sale with profit>,
    "confidence": "high/medium/low based on data quality"
  },
  "opportunities": ["List 3-5 specific opportunities you see in this market data"],
  "risks": ["List 2-4 risks or red flags to watch for"],
  "negotiationTips": ["3-4 specific negotiation strategies based on market conditions"],
  "competitorInsights": ["Key observations about competing listings - pricing strategies, what sells fast, etc."]
}

Base your recommendations on the actual scraped data. Be specific with numbers and actionable advice.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a professional car trading advisor. Always respond with valid JSON. Base all recommendations on the provided market data.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          aiAnalysis = JSON.parse(responseText);
        }
      } catch (aiError) {
        console.error('[Scrape API] AI analysis error:', aiError);
        // Continue without AI analysis if it fails
      }
    }

    const result: AnalysisResult = {
      scraping: scrapingResult,
      metrics,
      aiAnalysis,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Scrape API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape and analyze' },
      { status: 500 }
    );
  }
}
