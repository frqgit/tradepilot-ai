'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select } from '@/components/ui';
import Link from 'next/link';

interface UsageInfo {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  plan: string;
  planName: string;
  message: string;
}

interface CarAnalysisFormProps {
  onAnalyze: (data: AnalysisFormData) => void;
  isLoading: boolean;
}

export interface AnalysisFormData {
  year: number;
  make: string;
  model: string;
  variant?: string;
  odometer?: number;
  odometerMin?: number;
  odometerMax?: number;
  transmission?: string;
  fuelType?: string;
  bodyType?: string;
  colour?: string;
  askPrice?: number;
  urls: string[];
}

const transmissionOptions = [
  { value: '', label: 'Select transmission' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CVT', label: 'CVT' },
  { value: 'DCT', label: 'DCT' },
];

const fuelTypeOptions = [
  { value: '', label: 'Select fuel type' },
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ELECTRIC', label: 'Electric' },
];

const bodyTypeOptions = [
  { value: '', label: 'Select body type' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'SUV', label: 'SUV' },
  { value: 'WAGON', label: 'Wagon' },
  { value: 'UTE', label: 'Ute' },
];

const URL_PLACEHOLDERS = [
  'https://www.carsales.com.au/...',
  'https://www.gumtree.com.au/...',
  'https://www.facebook.com/marketplace/...',
  'https://www.autotrader.com.au/...',
  'https://www.carsguide.com.au/...',
  'https://www.drive.com.au/...',
  'https://www.pickles.com.au/...',
  'https://www.graysauctions.com/...',
  'https://www.manheim.com.au/...',
  'https://www.carfact.com.au/...',
];

// Generate search URLs for Australian car websites
function generateSearchUrls(make: string, model: string, year: number): string[] {
  if (!make || !model) return Array(10).fill('');
  
  const makeLower = make.toLowerCase().trim();
  const modelLower = model.toLowerCase().trim();
  const makeEncoded = encodeURIComponent(make.trim());
  const modelEncoded = encodeURIComponent(model.trim());
  const yearStr = year.toString();
  
  return [
    // 1. Carsales - Australia's largest car marketplace
    `https://www.carsales.com.au/cars/${makeLower}/${modelLower}/?q=(And.Service.Carsales._.Make.${makeEncoded}._.Model.${modelEncoded}._.Year.range(${year}..${year}).)`,
    
    // 2. Gumtree - Popular classifieds
    `https://www.gumtree.com.au/s-cars-vans-utes/c18320?search-category=cars-vans-utes&carmake=${makeEncoded}&carmodel=${modelEncoded}&caryear_i=${year}`,
    
    // 3. Facebook Marketplace - Search URL
    `https://www.facebook.com/marketplace/category/vehicles?make=${makeEncoded}&model=${modelEncoded}&minYear=${year}&maxYear=${year}`,
    
    // 4. AutoTrader Australia
    `https://www.autotrader.com.au/cars/${makeLower}/${modelLower}?year=${year}`,
    
    // 5. CarsGuide
    `https://www.carsguide.com.au/buy-a-car?make=${makeEncoded}&model=${modelEncoded}&price=&year_from=${year}&year_to=${year}`,
    
    // 6. Drive.com.au
    `https://www.drive.com.au/buy/search/?make=${makeEncoded}&model=${modelEncoded}&year_from=${year}&year_to=${year}`,
    
    // 7. Pickles Auctions
    `https://www.pickles.com.au/cars/search?keyword=${makeEncoded}+${modelEncoded}+${yearStr}`,
    
    // 8. Grays Auctions
    `https://www.grays.com/search?q=${makeEncoded}+${modelEncoded}+${yearStr}&category=motor-vehicles`,
    
    // 9. Manheim Auctions
    `https://www.manheim.com.au/search?make=${makeEncoded}&model=${modelEncoded}`,
    
    // 10. CarSales Commercial/Other
    `https://www.carsales.com.au/cars?q=${makeEncoded}+${modelEncoded}+${yearStr}`,
  ];
}

export function CarAnalysisForm({ onAnalyze, isLoading }: CarAnalysisFormProps) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    variant: '',
    odometerMin: '',
    odometerMax: '',
    transmission: '',
    fuelType: '',
    bodyType: '',
    colour: '',
    askPrice: '',
  });
  
  const [urls, setUrls] = useState<string[]>(Array(10).fill(''));
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // Fetch usage info on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/subscription/usage');
        if (response.ok) {
          const data = await response.json();
          setUsageInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setUsageLoading(false);
      }
    };
    fetchUsage();
  }, []);
  const [autoPopulated, setAutoPopulated] = useState(false);

  // Auto-populate URLs when make, model, and year are filled
  useEffect(() => {
    if (formData.make && formData.model && formData.year) {
      const generatedUrls = generateSearchUrls(formData.make, formData.model, formData.year);
      setUrls(generatedUrls);
      setAutoPopulated(true);
    } else {
      if (autoPopulated) {
        setUrls(Array(10).fill(''));
        setAutoPopulated(false);
      }
    }
  }, [formData.make, formData.model, formData.year]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const odometerMin = formData.odometerMin ? Number(formData.odometerMin) : undefined;
    const odometerMax = formData.odometerMax ? Number(formData.odometerMax) : undefined;
    // Calculate average odometer for backward compatibility
    const odometer = odometerMin && odometerMax 
      ? Math.round((odometerMin + odometerMax) / 2) 
      : odometerMin || odometerMax;
    
    onAnalyze({
      ...formData,
      year: Number(formData.year),
      odometer,
      odometerMin,
      odometerMax,
      askPrice: formData.askPrice ? Number(formData.askPrice) : undefined,
      urls: urls.filter(url => url.trim() !== ''),
    });
  };
  
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    setAutoPopulated(false); // Mark as manually edited
  };

  const clearUrls = () => {
    setUrls(Array(10).fill(''));
    setAutoPopulated(false);
  };

  const regenerateUrls = () => {
    if (formData.make && formData.model && formData.year) {
      const generatedUrls = generateSearchUrls(formData.make, formData.model, formData.year);
      setUrls(generatedUrls);
      setAutoPopulated(true);
    }
  };

  const isLimitReached = usageInfo ? !usageInfo.allowed : false;

  return (
    <div className="space-y-4">
      {/* Usage Indicator */}
      {!usageLoading && usageInfo && (
        <div className={`rounded-lg border p-4 ${
          isLimitReached 
            ? 'bg-red-50 border-red-200' 
            : usageInfo.remaining <= 1 && !usageInfo.isUnlimited
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {isLimitReached ? '🚫' : usageInfo.isUnlimited ? '♾️' : '📊'}
              </span>
              <div>
                <p className={`font-medium ${
                  isLimitReached ? 'text-red-800' : 'text-slate-800'
                }`}>
                  {usageInfo.isUnlimited ? (
                    'Unlimited analyses'
                  ) : isLimitReached ? (
                    'Daily limit reached'
                  ) : (
                    <>
                      {usageInfo.remaining} of {usageInfo.limit} analyses remaining today
                    </>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {usageInfo.planName} Plan
                  {!usageInfo.isUnlimited && !isLimitReached && usageInfo.remaining <= 1 && (
                    <span className="text-amber-600 ml-1">• Running low!</span>
                  )}
                </p>
              </div>
            </div>
            {(isLimitReached || (!usageInfo.isUnlimited && usageInfo.remaining <= 2)) && (
              <Link 
                href="/settings" 
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
          {isLimitReached && (
            <p className="text-sm text-red-600 mt-2">
              You&apos;ve used all your daily analyses. Upgrade to continue analyzing vehicles or wait until tomorrow.
            </p>
          )}
        </div>
      )}
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">🚗 Vehicle Details</h2>
      
      {/* Vehicle Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Input
          label="Year *"
          type="number"
          min="1990"
          max={new Date().getFullYear() + 1}
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
          required
        />
        <Input
          label="Make *"
          placeholder="e.g. Toyota"
          value={formData.make}
          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
          required
        />
        <Input
          label="Model *"
          placeholder="e.g. Camry"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          required
        />
        <Input
          label="Variant"
          placeholder="e.g. SL, Hybrid"
          value={formData.variant}
          onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
        />
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Odometer Range (km)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min (e.g. 60000)"
              value={formData.odometerMin}
              onChange={(e) => setFormData({ ...formData, odometerMin: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-slate-400 font-medium">to</span>
            <input
              type="number"
              placeholder="Max (e.g. 100000)"
              value={formData.odometerMax}
              onChange={(e) => setFormData({ ...formData, odometerMax: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Search for vehicles within this mileage range for more accurate market data</p>
        </div>
        <Select
          label="Transmission"
          options={transmissionOptions}
          value={formData.transmission}
          onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
        />
        <Select
          label="Fuel Type"
          options={fuelTypeOptions}
          value={formData.fuelType}
          onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
        />
        <Select
          label="Body Type"
          options={bodyTypeOptions}
          value={formData.bodyType}
          onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
        />
        <Input
          label="Colour"
          placeholder="e.g. White"
          value={formData.colour}
          onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
        />
        <Input
          label="Asking Price ($)"
          type="number"
          placeholder="e.g. 25000"
          value={formData.askPrice}
          onChange={(e) => setFormData({ ...formData, askPrice: e.target.value })}
        />
      </div>
      
      {/* URL Inputs */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-semibold text-slate-900">🌐 Market Comparison URLs</h3>
          <div className="flex gap-2">
            {autoPopulated && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                ✓ Auto-populated
              </span>
            )}
            <button
              type="button"
              onClick={regenerateUrls}
              disabled={!formData.make || !formData.model}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Regenerate
            </button>
            <button
              type="button"
              onClick={clearUrls}
              className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              ✕ Clear All
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {formData.make && formData.model ? (
            <>
              <span className="text-green-600 font-medium">URLs auto-generated</span> for {formData.year} {formData.make} {formData.model}. 
              Firecrawl will scrape these sites for real market data.
            </>
          ) : (
            <>Enter Year, Make, and Model above to auto-populate search URLs, or paste your own listing URLs below.</>
          )}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {urls.map((url, index) => (
            <div key={index} className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                {index + 1}.
              </span>
              <input
                type="url"
                placeholder={URL_PLACEHOLDERS[index]}
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                className={`w-full pl-8 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  url ? 'border-green-300 bg-green-50' : 'border-slate-200'
                }`}
              />
              {url && (
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Open in new tab"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Website Legend */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 font-medium mb-2">Supported Australian Car Sites:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-white rounded border">carsales.com.au</span>
            <span className="px-2 py-1 bg-white rounded border">gumtree.com.au</span>
            <span className="px-2 py-1 bg-white rounded border">facebook.com/marketplace</span>
            <span className="px-2 py-1 bg-white rounded border">autotrader.com.au</span>
            <span className="px-2 py-1 bg-white rounded border">carsguide.com.au</span>
            <span className="px-2 py-1 bg-white rounded border">drive.com.au</span>
            <span className="px-2 py-1 bg-white rounded border">pickles.com.au</span>
            <span className="px-2 py-1 bg-white rounded border">grays.com</span>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isLoading === true || isLimitReached === true} className="px-8">
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : isLimitReached ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Limit Reached - Upgrade
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze Market
            </>
          )}
        </Button>
      </div>
    </form>
    </div>
  );
}
