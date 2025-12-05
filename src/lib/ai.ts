import OpenAI from 'openai';
import type { Vehicle } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Market research result from AI agent
// NOTE: This is AI-ESTIMATED data based on GPT's training knowledge, NOT live scraped data
// For accurate real-time prices, integrate with actual APIs like Redbook, Glass's Guide, or carsales API
export interface MarketResearchResult {
  dataSource: 'ai-estimated' | 'live-api' | 'manual';
  dataFreshness: string; // e.g., "AI estimate based on training data (not real-time)"
  disclaimer: string;
  comparableListings: {
    source: string;
    title: string;
    price: number;
    odometer?: number;
    year: number;
    notes: string;
    isEstimated: boolean; // Flag to indicate this is AI-generated
  }[];
  marketSummary: {
    averagePrice: number;
    priceRange: { low: number; high: number };
    averageOdometer: number;
    demandLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    supplyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    marketTrend: 'RISING' | 'STABLE' | 'FALLING';
    bestTimeToSell: string;
    popularVariants: string[];
  };
  insights: string[];
}

/**
 * AI Agent for Market Research
 * Uses OpenAI to research current Australian car market based on its knowledge
 * This replaces web scraping which gets blocked
 */
export async function getAiMarketResearch(vehicle: {
  year: number;
  make: string;
  model: string;
  variant?: string | null;
  odometer?: number | null;
  odometerMin?: number | null;
  odometerMax?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  bodyType?: string | null;
}, referenceUrls?: string[]): Promise<MarketResearchResult> {
  
  const urlContext = referenceUrls?.length 
    ? `\n\nThe user has referenced these Australian car listing sites for context (use your knowledge of typical listings on these platforms):
${referenceUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}`
    : '';

  // Build odometer description
  let odometerDesc = 'Not specified';
  if (vehicle.odometerMin && vehicle.odometerMax) {
    odometerDesc = `${vehicle.odometerMin.toLocaleString()} - ${vehicle.odometerMax.toLocaleString()} km range`;
  } else if (vehicle.odometer) {
    odometerDesc = `${vehicle.odometer.toLocaleString()} km`;
  } else if (vehicle.odometerMin) {
    odometerDesc = `Minimum ${vehicle.odometerMin.toLocaleString()} km`;
  } else if (vehicle.odometerMax) {
    odometerDesc = `Maximum ${vehicle.odometerMax.toLocaleString()} km`;
  }

  const prompt = `You are an expert Australian car market research agent. Research the current market for this vehicle and provide detailed market intelligence.

VEHICLE TO RESEARCH:
- Year: ${vehicle.year}
- Make: ${vehicle.make}
- Model: ${vehicle.model}
- Variant: ${vehicle.variant || 'Any'}
- Odometer: ${odometerDesc}
- Transmission: ${vehicle.transmission || 'Any'}
- Fuel Type: ${vehicle.fuelType || 'Any'}
- Body Type: ${vehicle.bodyType || 'Any'}
${urlContext}

${vehicle.odometerMin && vehicle.odometerMax ? `IMPORTANT: Focus your research on vehicles with odometer readings between ${vehicle.odometerMin.toLocaleString()} km and ${vehicle.odometerMax.toLocaleString()} km. This is the target mileage range for accurate market comparison.` : ''}

Based on your knowledge of the Australian used car market (carsales.com.au, gumtree.com.au, autotrader.com.au, facebook marketplace, dealer sites, auction houses like Pickles, Manheim, etc.), provide:

1. COMPARABLE LISTINGS: Generate 5-8 realistic comparable listings that would typically be found in the Australian market right now. Include a mix from different sources.

2. MARKET SUMMARY: Analyze overall market conditions for this vehicle.

3. INSIGHTS: Provide 3-5 actionable insights for a car trader.

Respond in this exact JSON format:
{
  "comparableListings": [
    {
      "source": "carsales.com.au",
      "title": "2020 Toyota Camry Ascent Sport Auto",
      "price": 28990,
      "odometer": 45000,
      "year": 2020,
      "notes": "Dealer listing, includes warranty"
    }
  ],
  "marketSummary": {
    "averagePrice": 27500,
    "priceRange": { "low": 24000, "high": 32000 },
    "averageOdometer": 55000,
    "demandLevel": "HIGH",
    "supplyLevel": "MEDIUM",
    "marketTrend": "STABLE",
    "bestTimeToSell": "Spring/Summer for this model",
    "popularVariants": ["Ascent Sport", "SX", "SL"]
  },
  "insights": [
    "This model holds value well due to Toyota reliability reputation",
    "Hybrid variants command 15-20% premium",
    "Check for timing chain issues on pre-2019 models"
  ]
}

Be realistic with Australian market prices (in AUD). Use current 2024-2025 market conditions.

IMPORTANT: Your knowledge has a training cutoff date. Be conservative with pricing and acknowledge market volatility. Base estimates on historical patterns you know.

Respond ONLY with valid JSON, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Australian car market research agent with deep knowledge of carsales.com.au, gumtree, autotrader, and auction house pricing. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Clean and parse JSON
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    // Add transparency metadata
    return {
      ...parsed,
      dataSource: 'ai-estimated' as const,
      dataFreshness: 'AI estimate based on training data (not real-time market data)',
      disclaimer: 'These prices are AI-generated estimates based on historical market patterns. For accurate valuations, verify with live listings on carsales.com.au, Redbook, or Glass\'s Guide.',
      comparableListings: parsed.comparableListings.map((listing: any) => ({
        ...listing,
        isEstimated: true,
      })),
    } as MarketResearchResult;
  } catch (error) {
    console.error('AI Market Research error:', error);
    // Return fallback data
    return getFallbackMarketResearch(vehicle);
  }
}

function getFallbackMarketResearch(vehicle: { year: number; make: string; model: string }): MarketResearchResult {
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  const basePrice = 30000 - (age * 2500);
  
  return {
    dataSource: 'ai-estimated',
    dataFreshness: 'Fallback estimate (AI unavailable)',
    disclaimer: 'AI service unavailable. These are rough estimates only. Please verify with live market data.',
    comparableListings: [
      {
        source: 'Fallback Estimate',
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        price: Math.max(basePrice, 10000),
        odometer: 50000 + (age * 12000),
        year: vehicle.year,
        notes: 'Rough estimate - verify with live listings',
        isEstimated: true,
      },
    ],
    marketSummary: {
      averagePrice: Math.max(basePrice, 10000),
      priceRange: { 
        low: Math.max(basePrice * 0.85, 8000), 
        high: Math.max(basePrice * 1.15, 15000) 
      },
      averageOdometer: 50000 + (age * 12000),
      demandLevel: 'MEDIUM',
      supplyLevel: 'MEDIUM',
      marketTrend: 'STABLE',
      bestTimeToSell: 'Anytime - market is stable',
      popularVariants: ['Standard'],
    },
    insights: [
      '⚠️ AI market research unavailable - using rough estimates',
      '🔍 Verify prices on carsales.com.au, gumtree.com.au, or autotrader.com.au',
      '📊 Consider using Redbook or Glass\'s Guide for accurate valuations',
    ],
  };
}

export interface ValuationInput {
  vehicle: {
    year: number;
    make: string;
    model: string;
    variant?: string | null;
    odometer?: number | null;
    odometerMin?: number | null;
    odometerMax?: number | null;
    transmission?: string | null;
    fuelType?: string | null;
    bodyType?: string | null;
  };
  askPrice?: number | null;
  location?: string;
  marketData?: {
    comparablePrices?: number[];
    averageMarketPrice?: number;
    averageOdometer?: number;
    listingsFound?: number;
  };
}

export interface ValuationResult {
  fairValueLow: number;
  fairValueHigh: number;
  recommendedBuyPrice: number;
  targetSellPrice: number;
  estimatedMargin: number;
  estimatedDaysToSell: number;
  riskScore: number;
  recommendation: 'STRONG_BUY' | 'MAYBE' | 'SKIP';
  confidence: number;
  reasoning: string;
}

export async function getAiValuation(input: ValuationInput): Promise<ValuationResult> {
  const { vehicle, askPrice, location = 'Australia', marketData } = input;

  // Build odometer description
  let odometerDesc = 'Unknown';
  if (vehicle.odometerMin && vehicle.odometerMax) {
    odometerDesc = `${vehicle.odometerMin.toLocaleString()} - ${vehicle.odometerMax.toLocaleString()} km range`;
  } else if (vehicle.odometer) {
    odometerDesc = `${vehicle.odometer.toLocaleString()} km`;
  }

  // Build market data context if available
  const marketContext = marketData?.listingsFound 
    ? `\n\nLIVE MARKET DATA (from ${marketData.listingsFound} scraped listings):
- Average Market Price: ${marketData.averageMarketPrice ? `$${Math.round(marketData.averageMarketPrice).toLocaleString()}` : 'N/A'}
- Comparable Prices Found: ${marketData.comparablePrices?.length ? marketData.comparablePrices.map(p => `$${p.toLocaleString()}`).join(', ') : 'N/A'}
- Average Odometer in Market: ${marketData.averageOdometer ? `${Math.round(marketData.averageOdometer).toLocaleString()} km` : 'N/A'}

Use this real market data to inform your valuation. This data was scraped from live car listings in Australia.`
    : '';

  const odometerRangeNote = vehicle.odometerMin && vehicle.odometerMax 
    ? `\n\nIMPORTANT: The user is looking at vehicles within the ${vehicle.odometerMin.toLocaleString()} - ${vehicle.odometerMax.toLocaleString()} km odometer range. Base your valuation on vehicles within this mileage bracket for accuracy.`
    : '';

  const prompt = `You are an expert car valuation AI for the Australian used car market. Analyze this vehicle and provide pricing recommendations for a professional car trader.

Vehicle Details:
- Year: ${vehicle.year}
- Make: ${vehicle.make}
- Model: ${vehicle.model}
- Variant: ${vehicle.variant || 'Standard'}
- Odometer: ${odometerDesc}
- Transmission: ${vehicle.transmission || 'Unknown'}
- Fuel Type: ${vehicle.fuelType || 'Unknown'}
- Body Type: ${vehicle.bodyType || 'Unknown'}
- Asking Price: ${askPrice ? `$${askPrice.toLocaleString()}` : 'Not specified'}
- Location: ${location}${marketContext}${odometerRangeNote}

Provide your analysis in the following JSON format:
{
  "fairValueLow": <number - low end of fair market value in AUD>,
  "fairValueHigh": <number - high end of fair market value in AUD>,
  "recommendedBuyPrice": <number - maximum price a trader should pay for good margin>,
  "targetSellPrice": <number - realistic selling price for a trader>,
  "estimatedMargin": <number - expected profit margin percentage>,
  "estimatedDaysToSell": <number - expected days to sell>,
  "riskScore": <number 0-100 - higher means more risky>,
  "recommendation": <"STRONG_BUY" | "MAYBE" | "SKIP">,
  "confidence": <number 0-100 - confidence in this valuation>,
  "reasoning": "<string - 2-3 sentences explaining the recommendation>"
}

Consider:
1. Current market conditions in Australia
2. This vehicle's popularity and demand
3. Typical depreciation patterns
4. Seasonal factors
5. Reconditioning costs (~$500-$2000 typical)
6. Trading costs (transport, advertising, etc.)
7. Target margin of 10-20% for traders

Respond ONLY with valid JSON, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a car valuation expert AI. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const result = JSON.parse(content);
    return result as ValuationResult;
  } catch (error) {
    console.error('AI Valuation error:', error);
    // Return a fallback estimation based on simple heuristics
    return getFallbackValuation(input);
  }
}

function getFallbackValuation(input: ValuationInput): ValuationResult {
  const { vehicle, askPrice } = input;
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;

  // Simple heuristic pricing
  const baseValue = askPrice || 20000;
  const depreciation = Math.max(0.5, 1 - age * 0.08); // 8% per year, min 50%
  const kmPenalty = vehicle.odometer ? Math.max(0.7, 1 - (vehicle.odometer / 200000) * 0.3) : 0.9;

  const estimatedValue = baseValue * depreciation * kmPenalty;
  const fairValueLow = Math.round(estimatedValue * 0.9);
  const fairValueHigh = Math.round(estimatedValue * 1.1);
  const recommendedBuyPrice = Math.round(estimatedValue * 0.85);
  const targetSellPrice = Math.round(estimatedValue * 1.05);

  const margin = askPrice ? ((targetSellPrice - askPrice) / askPrice) * 100 : 15;
  const daysToSell = age <= 3 ? 21 : age <= 7 ? 35 : 50;
  const riskScore = age <= 3 ? 25 : age <= 7 ? 45 : 65;

  let recommendation: 'STRONG_BUY' | 'MAYBE' | 'SKIP' = 'MAYBE';
  if (askPrice && askPrice < recommendedBuyPrice) recommendation = 'STRONG_BUY';
  if (askPrice && askPrice > fairValueHigh) recommendation = 'SKIP';

  return {
    fairValueLow,
    fairValueHigh,
    recommendedBuyPrice,
    targetSellPrice,
    estimatedMargin: Math.round(margin * 10) / 10,
    estimatedDaysToSell: daysToSell,
    riskScore,
    recommendation,
    confidence: 50,
    reasoning: 'This is a heuristic estimate. AI valuation unavailable. Based on age, mileage, and asking price.',
  };
}

export interface DealSummaryInput {
  vehicle: Vehicle;
  askPrice?: number | null;
  fairValueLow?: number | null;
  fairValueHigh?: number | null;
  estimatedMargin?: number | null;
  riskScore?: number | null;
}

export async function getAiDealSummary(input: DealSummaryInput): Promise<string> {
  const { vehicle, askPrice, fairValueLow, fairValueHigh, estimatedMargin, riskScore } = input;

  const prompt = `You are an AI assistant for a car trader. Generate a concise deal summary for this vehicle.

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''}
Odometer: ${vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : 'Unknown'}
Transmission: ${vehicle.transmission || 'Unknown'}
Fuel: ${vehicle.fuelType || 'Unknown'}
Asking Price: ${askPrice ? `$${askPrice.toLocaleString()}` : 'Not specified'}
Fair Value Range: ${fairValueLow && fairValueHigh ? `$${fairValueLow.toLocaleString()} - $${fairValueHigh.toLocaleString()}` : 'Not calculated'}
Estimated Margin: ${estimatedMargin ? `${estimatedMargin}%` : 'Unknown'}
Risk Score: ${riskScore ? `${riskScore}/100` : 'Unknown'}

Write a brief 3-4 sentence summary covering:
1. Whether this looks like a good deal
2. Key pros and cons
3. What to watch out for
4. Suggested action

Keep it practical and trader-focused.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful car trading assistant. Be concise and practical.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'Unable to generate summary.';
  } catch (error) {
    console.error('AI Summary error:', error);
    return 'AI summary unavailable. Please check vehicle details and pricing manually.';
  }
}

export interface MessageTemplateInput {
  vehicle: Vehicle;
  askPrice?: number | null;
  recommendedOffer?: number | null;
  messageType: 'inquiry' | 'offer' | 'followup';
  tone: 'polite' | 'firm' | 'urgent' | 'casual';
  sellerName?: string;
}

export async function getAiMessageTemplate(input: MessageTemplateInput): Promise<string> {
  const { vehicle, askPrice, recommendedOffer, messageType, tone, sellerName } = input;

  const typeDescriptions = {
    inquiry: 'initial inquiry about the vehicle',
    offer: 'making an offer on the vehicle',
    followup: 'following up on a previous inquiry',
  };

  const prompt = `Generate a ${tone} ${typeDescriptions[messageType]} message for this vehicle:

Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Asking Price: ${askPrice ? `$${askPrice.toLocaleString()}` : 'Not listed'}
${recommendedOffer ? `Offer Amount: $${recommendedOffer.toLocaleString()}` : ''}
${sellerName ? `Seller Name: ${sellerName}` : ''}

Write a professional but friendly message suitable for SMS/email. Keep it under 150 words.
Don't use overly formal language. Sound like a real person.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are helping a car trader write messages to sellers. Be professional but human.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0].message.content || 'Unable to generate message.';
  } catch (error) {
    console.error('AI Message error:', error);
    return `Hi${sellerName ? ` ${sellerName}` : ''},\n\nI'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} you have listed. Is it still available?\n\nThanks`;
  }
}
