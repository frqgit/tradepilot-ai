'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { DealCard, AddDealModal, CarAnalysisForm, AnalysisResults } from '@/components/deals';
import type { DealWithRelations } from '@/types';
import type { AnalysisFormData } from '@/components/deals/CarAnalysisForm';
import type { AnalysisResultData } from '@/components/deals/AnalysisResults';

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'deals'>('analyze');
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisFormData, setAnalysisFormData] = useState<AnalysisFormData | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const response = await fetch(`/api/deals?${params}`);
      const data = await response.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'deals') fetchDeals();
  }, [filter, activeTab]);

  const handleAnalyze = async (data: AnalysisFormData) => {
    setIsAnalyzing(true);
    setAnalysisResults(null);
    setAnalysisFormData(data);
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const results = await response.json();
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAsDeal = async () => {
    if (!analysisFormData || !analysisResults) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle: {
            year: analysisFormData.year,
            make: analysisFormData.make,
            model: analysisFormData.model,
            variant: analysisFormData.variant,
            odometer: analysisFormData.odometer,
            transmission: analysisFormData.transmission,
            fuelType: analysisFormData.fuelType,
            bodyType: analysisFormData.bodyType,
            colour: analysisFormData.colour,
          },
          askPrice: analysisFormData.askPrice,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save deal');
      
      alert('Deal saved successfully!');
      setActiveTab('deals');
      setAnalysisResults(null);
      fetchDeals();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save deal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All Deals' },
    { value: 'SOURCED', label: 'Sourced' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'OFFERED', label: 'Offered' },
    { value: 'ACQUIRED', label: 'Acquired' },
    { value: 'LISTED', label: 'Listed' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deal Center</h1>
            <p className="text-slate-500 mt-1">Analyze markets and manage your deals</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'analyze'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔍 Search & Analyze
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-6 py-2.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'deals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 My Deals ({deals.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analyze' ? (
          <div>
            <CarAnalysisForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
            
            {isAnalyzing && (
              <div className="mt-8 text-center py-12 bg-white rounded-xl border border-slate-200">
                <svg className="animate-spin h-10 w-10 mx-auto text-blue-600 mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 font-medium">Scraping market data & analyzing...</p>
                <p className="text-sm text-slate-400 mt-1">This may take 30-60 seconds</p>
              </div>
            )}
            
            <AnalysisResults 
              results={analysisResults} 
              onSaveAsDeal={handleSaveAsDeal}
              isSaving={isSaving}
            />
          </div>
        ) : (
          <div>
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {statusFilters.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filter === item.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Deal
              </Button>
            </div>

            {/* Deals List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-slate-900">No deals yet</h3>
                <p className="mt-2 text-slate-500">Analyze a car to get started, or add a deal manually</p>
                <Button className="mt-6" onClick={() => setActiveTab('analyze')}>
                  Start Analyzing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Deal Modal */}
        <AddDealModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchDeals}
        />
      </div>
    </MainLayout>
  );
}
