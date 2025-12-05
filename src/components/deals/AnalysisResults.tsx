'use client';

import { Button, Badge, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface AiListing {
  url: string;
  source: string;
  status: 'success' | 'blocked' | 'error' | 'auto-discovered' | 'ai-researched' | 'scraped';
  title?: string;
  price?: number;
  year?: number;
  odometer?: number;
  location?: string;
  seller?: string;
  sellerType?: string;
  condition?: string;
  transmission?: string;
  fuelType?: string;
  description?: string;
  features?: string[];
  scrapedAt?: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlexibleItem = string | { [key: string]: any };

interface FirecrawlAnalysis {
  metrics: {
    count: number;
    priceRange: { min: number; max: number; median: number; average: number };
    mileageRange?: { min: number; max: number; average: number };
    yearRange?: { min: number; max: number };
    sellerTypes: { dealer: number; private: number; unknown: number };
    locations: string[];
  } | null;
  analysis: {
    marketPosition: string;
    priceAnalysis: string;
    bestDeals: FlexibleItem[];
    overpriced: FlexibleItem[];
    recommendations: FlexibleItem[];
    negotiationLeverage: string;
  };
  dataSource: string;
  disclaimer: string;
}

interface AnalysisResultsProps {
  results: AnalysisResultData | null;
  onSaveAsDeal: () => void;
  isSaving: boolean;
}

export interface AnalysisResultData {
  vehicle: {
    year: number;
    make: string;
    model: string;
    variant?: string;
    askPrice?: number;
  };
  scrapedListings: AiListing[];
  scrapingStats: {
    total: number;
    success: number;
    blocked: number;
    autoDiscovered?: number;
    firecrawlScraped?: number;
    aiResearched?: number;
  };
  // Firecrawl-specific analysis
  firecrawlAnalysis?: FirecrawlAnalysis | null;
  // Scraping errors for transparency
  scrapingErrors?: string[];
  scrapingNote?: string;
  // Transparency metadata
  dataSource?: string;
  dataFreshness?: string;
  disclaimer?: string;
  marketResearch?: {
    summary: {
      averagePrice: number;
      priceRange: { low: number; high: number };
      averageOdometer: number;
      demandLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      supplyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      marketTrend: 'RISING' | 'STABLE' | 'FALLING';
      bestTimeToSell: string;
      popularVariants: FlexibleItem[];
    };
    insights: FlexibleItem[];
  };
  valuation: {
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
  };
}

function getRecommendationStyle(rec: string) {
  switch (rec) {
    case 'STRONG_BUY': return { bg: 'bg-green-100 border-green-300', text: 'text-green-800', label: '🔥 Strong Buy' };
    case 'MAYBE': return { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-800', label: '🤔 Maybe' };
    case 'SKIP': return { bg: 'bg-red-100 border-red-300', text: 'text-red-800', label: '⛔ Skip' };
    default: return { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800', label: rec };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success': return <Badge variant="success" size="sm">✓ Scraped</Badge>;
    case 'scraped': return <Badge variant="success" size="sm">🔥 Firecrawl</Badge>;
    case 'blocked': return <Badge variant="warning" size="sm">⚠ Blocked</Badge>;
    case 'auto-discovered': return <Badge variant="info" size="sm">🔍 Auto-found</Badge>;
    case 'ai-researched': return <Badge variant="info" size="sm">🤖 AI Research</Badge>;
    default: return <Badge variant="danger" size="sm">✗ Error</Badge>;
  }
}

function getDemandBadge(level: string) {
  switch (level) {
    case 'HIGH': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">High</span>;
    case 'MEDIUM': return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Medium</span>;
    case 'LOW': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">Low</span>;
    default: return null;
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'RISING': return <span className="text-green-600">📈 Rising</span>;
    case 'FALLING': return <span className="text-red-600">📉 Falling</span>;
    case 'STABLE': return <span className="text-blue-600">➡️ Stable</span>;
    default: return null;
  }
}

export function AnalysisResults({ results, onSaveAsDeal, isSaving }: AnalysisResultsProps) {
  if (!results) return null;
  
  const { vehicle, scrapedListings, scrapingStats, marketResearch, valuation, dataSource, dataFreshness, disclaimer, firecrawlAnalysis, scrapingErrors, scrapingNote } = results;
  const recStyle = getRecommendationStyle(valuation.recommendation);
  const hasFirecrawlData = firecrawlAnalysis && firecrawlAnalysis.metrics && firecrawlAnalysis.metrics.count > 0;
  const isAiEstimated = dataSource === 'ai-estimated' || (!hasFirecrawlData && !dataSource?.includes('Firecrawl'));
  
  return (
    <div className="space-y-6 mt-8">
      {/* Scraping Blocked Notice */}
      {scrapingNote && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <h4 className="font-semibold text-orange-800">Web Scraping Blocked</h4>
              <p className="text-sm text-orange-700 mt-1">{scrapingNote}</p>
              {scrapingErrors && scrapingErrors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-orange-600 cursor-pointer hover:text-orange-800">
                    View blocked sites ({scrapingErrors.length})
                  </summary>
                  <ul className="mt-1 text-xs text-orange-600 list-disc ml-5 space-y-1">
                    {scrapingErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="text-xs text-orange-600 mt-2">
                💡 <strong>Tip:</strong> For real-time data, manually check <a href="https://www.carsales.com.au" target="_blank" rel="noopener" className="underline">carsales.com.au</a> or <a href="https://www.redbook.com.au" target="_blank" rel="noopener" className="underline">Redbook</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Warning */}
      {isAiEstimated && !scrapingNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-amber-800">AI-Estimated Values</h4>
              <p className="text-sm text-amber-700 mt-1">
                {disclaimer || 'These prices are AI-generated estimates based on historical market patterns, not live market data.'}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                <strong>Data freshness:</strong> {dataFreshness || 'AI estimate based on training data'}
              </p>
              <div className="mt-3 text-xs text-amber-700">
                <strong>For accurate real-time valuations, verify with:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li><a href="https://www.carsales.com.au" target="_blank" rel="noopener" className="underline hover:text-amber-900">carsales.com.au</a> - Search current listings</li>
                  <li><a href="https://www.redbook.com.au" target="_blank" rel="noopener" className="underline hover:text-amber-900">Redbook</a> - Official vehicle valuations</li>
                  <li><a href="https://www.glassguide.com.au" target="_blank" rel="noopener" className="underline hover:text-amber-900">Glass's Guide</a> - Trade valuations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Banner */}
      <div className={`${recStyle.bg} rounded-xl p-6 border`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-2xl font-bold ${recStyle.text}`}>{recStyle.label}</span>
            <p className="text-slate-700 mt-1">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.variant || ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Confidence</div>
            <div className="text-xl font-semibold">{Math.round(valuation.confidence)}%</div>
          </div>
        </div>
      </div>
      
      {/* Valuation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500">Fair Value Range</div>
          <div className="text-lg font-semibold text-slate-900">
            {formatCurrency(valuation.fairValueLow)} - {formatCurrency(valuation.fairValueHigh)}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500">Recommended Buy</div>
          <div className="text-lg font-semibold text-green-600">
            {formatCurrency(valuation.recommendedBuyPrice)}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500">Target Sell</div>
          <div className="text-lg font-semibold text-blue-600">
            {formatCurrency(valuation.targetSellPrice)}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500">Est. Margin</div>
          <div className={`text-lg font-semibold ${valuation.estimatedMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {valuation.estimatedMargin > 0 ? '+' : ''}{valuation.estimatedMargin.toFixed(1)}%
          </div>
        </Card>
      </div>
      
      {/* Risk & Time */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Risk Score</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${valuation.riskScore < 30 ? 'bg-green-500' : valuation.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${valuation.riskScore}%` }}
                />
              </div>
              <span className="font-medium">{valuation.riskScore}/100</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Est. Days to Sell</span>
            <span className="font-medium">{valuation.estimatedDaysToSell} days</span>
          </div>
        </Card>
      </div>

      {/* Market Summary (New!) */}
      {marketResearch?.summary && (
        <Card className="p-4">
          <h3 className="font-semibold text-slate-900 mb-4">📊 Market Intelligence</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase">Market Price Range</div>
              <div className="font-medium">{formatCurrency(marketResearch.summary.priceRange.low)} - {formatCurrency(marketResearch.summary.priceRange.high)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Demand Level</div>
              <div className="mt-1">{getDemandBadge(marketResearch.summary.demandLevel)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Market Trend</div>
              <div className="mt-1">{getTrendIcon(marketResearch.summary.marketTrend)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Best Time to Sell</div>
              <div className="font-medium text-sm">{marketResearch.summary.bestTimeToSell}</div>
            </div>
          </div>
          {marketResearch.summary.popularVariants.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 uppercase mb-2">Popular Variants</div>
              <div className="flex flex-wrap gap-2">
                {marketResearch.summary.popularVariants.map((v, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                    {typeof v === 'string' ? v : v.name || v.variant || JSON.stringify(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* AI Insights (New!) */}
      {marketResearch?.insights && marketResearch.insights.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-slate-900 mb-3">💡 Key Insights</h3>
          <ul className="space-y-2">
            {marketResearch.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-600">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{typeof insight === 'string' ? insight : insight.text || insight.insight || JSON.stringify(insight)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Firecrawl Analysis - Real Scraped Data */}
      {hasFirecrawlData && firecrawlAnalysis && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-bold text-orange-900">Firecrawl Real-Time Market Data</h3>
              <p className="text-sm text-orange-700">Scraped from {firecrawlAnalysis.metrics?.count} actual listings</p>
            </div>
          </div>
          
          {/* Firecrawl Metrics */}
          {firecrawlAnalysis.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/50 rounded-lg p-4">
              <div>
                <div className="text-xs text-orange-600 uppercase font-medium">Price Range</div>
                <div className="font-semibold text-slate-900">
                  {formatCurrency(firecrawlAnalysis.metrics.priceRange.min)} - {formatCurrency(firecrawlAnalysis.metrics.priceRange.max)}
                </div>
              </div>
              <div>
                <div className="text-xs text-orange-600 uppercase font-medium">Average Price</div>
                <div className="font-semibold text-slate-900">
                  {formatCurrency(firecrawlAnalysis.metrics.priceRange.average)}
                </div>
              </div>
              <div>
                <div className="text-xs text-orange-600 uppercase font-medium">Median Price</div>
                <div className="font-semibold text-slate-900">
                  {formatCurrency(firecrawlAnalysis.metrics.priceRange.median)}
                </div>
              </div>
              {firecrawlAnalysis.metrics.mileageRange && (
                <div>
                  <div className="text-xs text-orange-600 uppercase font-medium">Avg Mileage</div>
                  <div className="font-semibold text-slate-900">
                    {firecrawlAnalysis.metrics.mileageRange.average.toLocaleString()} km
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Firecrawl AI Analysis */}
          {firecrawlAnalysis.analysis && (
            <div className="space-y-4">
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">📊 Market Position</h4>
                <p className="text-slate-700">{firecrawlAnalysis.analysis.marketPosition}</p>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">💰 Price Analysis</h4>
                <p className="text-slate-700">{firecrawlAnalysis.analysis.priceAnalysis}</p>
              </div>

              {firecrawlAnalysis.analysis.bestDeals && firecrawlAnalysis.analysis.bestDeals.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">🎯 Best Deals Found</h4>
                  <ul className="space-y-2">
                    {firecrawlAnalysis.analysis.bestDeals.map((deal, i) => (
                      <li key={i} className="text-green-800 text-sm">
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <div>
                            <span>{typeof deal === 'string' ? deal : deal.deal || deal.title || 'Deal found'}</span>
                            {typeof deal === 'object' && deal.price && (
                              <span className="ml-2 font-semibold text-green-700">{formatCurrency(deal.price)}</span>
                            )}
                            {typeof deal === 'object' && deal.url && (
                              <a 
                                href={deal.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:underline text-xs"
                              >
                                View →
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {firecrawlAnalysis.analysis.recommendations && firecrawlAnalysis.analysis.recommendations.length > 0 && (
                <div className="bg-white/50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">💡 Recommendations</h4>
                  <ul className="space-y-1">
                    {firecrawlAnalysis.analysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                        <span className="text-orange-500">→</span>
                        <span>{typeof rec === 'string' ? rec : rec.text || rec.recommendation || JSON.stringify(rec)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {firecrawlAnalysis.analysis.negotiationLeverage && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">🤝 Negotiation Leverage</h4>
                  <p className="text-blue-800">{firecrawlAnalysis.analysis.negotiationLeverage}</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-orange-600 italic">
            {firecrawlAnalysis.disclaimer}
          </p>
        </div>
      )}
      
      {/* AI Reasoning */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 mb-2">🤖 AI Analysis</h3>
        <p className="text-slate-600">{valuation.reasoning}</p>
      </Card>
      
      {/* Market Data Sources */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 mb-3">📋 Comparable Listings</h3>
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          {scrapingStats.firecrawlScraped && scrapingStats.firecrawlScraped > 0 && (
            <span className="text-orange-600 font-medium">🔥 {scrapingStats.firecrawlScraped} Firecrawl scraped</span>
          )}
          {scrapingStats.aiResearched && scrapingStats.aiResearched > 0 && (
            <span className="text-purple-600">🤖 {scrapingStats.aiResearched} AI-researched</span>
          )}
          {scrapingStats.blocked > 0 && (
            <span className="text-amber-600">⚠ {scrapingStats.blocked} blocked</span>
          )}
        </div>
        
        {/* Listings Table */}
        {scrapedListings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2 font-medium text-slate-600">Source</th>
                  <th className="text-left p-2 font-medium text-slate-600">Status</th>
                  <th className="text-left p-2 font-medium text-slate-600">Listing</th>
                  <th className="text-right p-2 font-medium text-slate-600">Price</th>
                  <th className="text-right p-2 font-medium text-slate-600">Odometer</th>
                  <th className="text-left p-2 font-medium text-slate-600">Location</th>
                </tr>
              </thead>
              <tbody>
                {scrapedListings.map((listing, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2">
                      {listing.url && listing.url.startsWith('http') ? (
                        <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {listing.source}
                        </a>
                      ) : (
                        <span className="text-slate-600">{listing.source}</span>
                      )}
                    </td>
                    <td className="p-2">{getStatusBadge(listing.status)}</td>
                    <td className="p-2 max-w-xs">
                      <div className="truncate text-slate-700">{listing.title || '-'}</div>
                      {listing.seller && (
                        <div className="text-xs text-slate-400">
                          {listing.seller} {listing.sellerType ? `(${listing.sellerType})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-right font-medium">{listing.price ? formatCurrency(listing.price) : '-'}</td>
                    <td className="p-2 text-right">{listing.odometer ? `${listing.odometer.toLocaleString()} km` : '-'}</td>
                    <td className="p-2 text-slate-600">{listing.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <p className="mt-4 text-xs text-slate-400">
          * Market data is researched by AI based on current Australian car market knowledge. Prices are estimates based on typical listings.
        </p>
      </Card>
      
      {/* Save as Deal Button */}
      <div className="flex justify-end gap-4">
        <Button onClick={onSaveAsDeal} disabled={isSaving} variant="primary" className="px-6">
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save as Deal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
