import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAiValuation, getAiMarketResearch } from '@/lib/ai';
import { 
  scrapeMultipleListings, 
  formatListingsForAI, 
  extractListingMetrics,
  CarListingData,
  isFirecrawlConfigured 
} from '@/lib/firecrawl';
import { canPerformAnalysis, incrementUsage, PLAN_CONFIG } from '@/lib/subscription';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check usage limits before proceeding
    const usageCheck = await canPerformAnalysis(organizationId);
    if (!usageCheck.allowed) {
      const planConfig = PLAN_CONFIG[usageCheck.plan];
      return NextResponse.json({
        error: 'Daily analysis limit reached',
        usageLimit: {
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          plan: usageCheck.plan,
          planName: planConfig.name,
          upgradeMessage: `You've used all ${usageCheck.limit} analyses for today. Upgrade your plan for more analyses.`,
        },
      }, { status: 429 }); // Too Many Requests
    }

    const body = await request.json();
    const { year, make, model, variant, odometer, odometerMin, odometerMax, transmission, fuelType, bodyType, colour, askPrice, urls } = body;

    if (!year || !make || !model) {
      return NextResponse.json({ error: 'Year, make, and model are required' }, { status: 400 });
    }

    const vehicle = {
      year,
      make,
      model,
      variant,
      odometer,
      odometerMin,
      odometerMax,
      transmission,
      fuelType,
      bodyType,
      colour,
    };

    // Check if we have URLs to scrape with Firecrawl
    const validUrls = (urls || []).filter((url: string) => url && url.trim() !== '');
    let scrapedData: CarListingData[] = [];
    let scrapingResult = null;
    let firecrawlMetrics = null;
    let firecrawlAnalysis = null;
    let scrapingErrors: string[] = [];

    // Try Firecrawl scraping if configured and URLs provided
    if (validUrls.length > 0 && isFirecrawlConfigured()) {
      console.log(`[Analyze API] Attempting to scrape ${validUrls.length} URLs with Firecrawl`);
      
      try {
        // Use Firecrawl for real web scraping
        scrapingResult = await scrapeMultipleListings(validUrls, {
          concurrency: 2, // Lower concurrency to avoid rate limits
        });
        
        scrapedData = scrapingResult.listings;
        firecrawlMetrics = extractListingMetrics(scrapedData);
        
        // Collect errors for transparency
        if (scrapingResult.failedUrls.length > 0) {
          scrapingErrors = scrapingResult.failedUrls.map(f => `${new URL(f.url).hostname}: ${f.error}`);
        }
        
        console.log(`[Analyze API] Firecrawl: ${scrapedData.length} success, ${scrapingResult.totalFailed} failed`);
      } catch (firecrawlError) {
        console.error('[Analyze API] Firecrawl error:', firecrawlError);
        scrapingErrors.push(`Firecrawl service error: ${firecrawlError instanceof Error ? firecrawlError.message : 'Unknown error'}`);
      }

      // If we got real scraped data, analyze it with AI
      if (scrapedData.length > 0) {
        const formattedListings = formatListingsForAI(scrapedData);
        
        try {
          const firecrawlPrompt = `Analyze these REAL scraped car listings for a ${year} ${make} ${model}${variant ? ` ${variant}` : ''}.

${formattedListings}

${firecrawlMetrics ? `
Market Data Summary:
- ${firecrawlMetrics.count} listings scraped
- Price Range: $${firecrawlMetrics.priceRange.min.toLocaleString()} - $${firecrawlMetrics.priceRange.max.toLocaleString()}
- Average Price: $${firecrawlMetrics.priceRange.average.toLocaleString()}
- Median Price: $${firecrawlMetrics.priceRange.median.toLocaleString()}
${firecrawlMetrics.mileageRange ? `- Mileage Range: ${firecrawlMetrics.mileageRange.min.toLocaleString()} - ${firecrawlMetrics.mileageRange.max.toLocaleString()} km` : ''}
` : ''}

${askPrice ? `The user is considering a price of $${askPrice.toLocaleString()}` : ''}
${odometer ? `The target vehicle has ${odometer.toLocaleString()} km on the odometer.` : ''}

Provide analysis as JSON:
{
  "marketPosition": "How does this vehicle compare to the scraped listings?",
  "priceAnalysis": "Analysis of pricing based on REAL scraped data",
  "bestDeals": ["Top 2-3 best deals from the scraped listings with URLs"],
  "overpriced": ["Any overpriced listings from the scraped data"],
  "recommendations": ["3-4 specific recommendations based on this real market data"],
  "negotiationLeverage": "What leverage do you have based on competing listings?"
}`;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: 'You are a car market analyst. Analyze the REAL scraped data provided. Respond with valid JSON.' },
              { role: 'user', content: firecrawlPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 1500,
          });

          const responseText = completion.choices[0]?.message?.content;
          if (responseText) {
            firecrawlAnalysis = JSON.parse(responseText);
          }
        } catch (aiError) {
          console.error('[Analyze API] Firecrawl AI analysis error:', aiError);
        }
      }
    }

    // Step 1: Use AI Agent for additional market research
    console.log('Starting AI market research for:', `${year} ${make} ${model}`);
    const marketResearch = await getAiMarketResearch(vehicle, urls);

    // Step 2: Combine market data from both sources
    const allPrices = [
      ...scrapedData.filter(l => l.price).map(l => l.price!),
      ...marketResearch.comparableListings.map(l => l.price),
    ];
    
    const marketOdometers = [
      ...scrapedData.filter(l => l.mileage).map(l => l.mileage!),
      ...marketResearch.comparableListings.filter(l => l.odometer).map(l => l.odometer!),
    ];

    const avgPrice = allPrices.length > 0 
      ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
      : marketResearch.marketSummary.averagePrice;

    // Step 3: Get AI valuation with combined market context
    const valuation = await getAiValuation({
      vehicle,
      askPrice,
      marketData: {
        comparablePrices: allPrices,
        averageMarketPrice: avgPrice,
        averageOdometer: marketOdometers.length > 0 
          ? Math.round(marketOdometers.reduce((a, b) => a + b, 0) / marketOdometers.length)
          : marketResearch.marketSummary.averageOdometer,
        listingsFound: scrapedData.length + marketResearch.comparableListings.length,
      },
    });

    // Step 4: Convert scraped data to UI-compatible format
    const firecrawlListings = scrapedData.map(listing => ({
      url: listing.url,
      source: new URL(listing.url).hostname,
      status: 'scraped' as const,
      title: listing.title || 'Unknown',
      price: listing.price,
      year: listing.year,
      odometer: listing.mileage,
      location: listing.location,
      seller: listing.seller,
      sellerType: listing.sellerType,
      condition: listing.condition,
      transmission: listing.transmission,
      fuelType: listing.fuelType,
      description: listing.description,
      features: listing.features,
      scrapedAt: listing.scrapedAt,
      error: listing.error,
    }));

    const aiGeneratedListings = marketResearch.comparableListings.map(listing => ({
      url: `https://${listing.source.replace('www.', '')}`,
      source: listing.source,
      status: 'ai-researched' as const,
      title: listing.title,
      price: listing.price,
      year: listing.year,
      odometer: listing.odometer,
      error: undefined,
    }));

    // Increment usage count after successful analysis
    const newUsageCount = await incrementUsage(organizationId);
    const updatedUsageCheck = await canPerformAnalysis(organizationId);

    // Step 5: Return comprehensive analysis with both data sources
    return NextResponse.json({
      vehicle: { year, make, model, variant, askPrice },
      // Combined scraped listings (Firecrawl first, then AI-researched)
      scrapedListings: [...firecrawlListings, ...aiGeneratedListings],
      scrapingStats: {
        total: firecrawlListings.length + aiGeneratedListings.length,
        success: firecrawlListings.filter(l => !l.error).length + aiGeneratedListings.length,
        blocked: scrapingResult?.totalFailed || 0,
        firecrawlScraped: firecrawlListings.length,
        aiResearched: aiGeneratedListings.length,
      },
      // Firecrawl-specific analysis from REAL scraped data
      firecrawlAnalysis: firecrawlAnalysis ? {
        metrics: firecrawlMetrics,
        analysis: firecrawlAnalysis,
        dataSource: 'Firecrawl - Real-time web scraping',
        disclaimer: 'Based on actual data scraped from provided URLs',
      } : null,
      // AI-researched data (fallback/supplement)
      dataSource: scrapedData.length > 0 
        ? 'Firecrawl (primary) + AI Market Research (supplementary)' 
        : marketResearch.dataSource,
      dataFreshness: scrapedData.length > 0 
        ? 'Real-time scraped data' 
        : marketResearch.dataFreshness,
      disclaimer: scrapedData.length > 0
        ? 'Primary analysis based on real scraped data from Firecrawl. AI research supplements where needed.'
        : marketResearch.disclaimer,
      // Include scraping errors for transparency
      scrapingErrors: scrapingErrors.length > 0 ? scrapingErrors : undefined,
      scrapingNote: scrapingErrors.length > 0 && scrapedData.length === 0
        ? 'Web scraping was blocked by all sites. Analysis uses AI market research instead. This is common for Australian car sites which have strong anti-bot protections.'
        : undefined,
      marketResearch: {
        summary: marketResearch.marketSummary,
        insights: marketResearch.insights,
      },
      valuation,
      // Include usage info in response
      usage: {
        used: newUsageCount,
        limit: updatedUsageCheck.limit,
        remaining: updatedUsageCheck.remaining,
        isUnlimited: updatedUsageCheck.limit === -1,
        plan: updatedUsageCheck.plan,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}
