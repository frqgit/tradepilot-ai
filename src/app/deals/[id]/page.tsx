'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  getRecommendationColor,
  getRecommendationLabel,
  getDealStatusColor,
  getDealStatusLabel,
  generateVehicleTitle,
  getRiskColor,
  calculateDaysInStock,
} from '@/lib/utils';
import type { DealWithRelations } from '@/types';

const statusOptions = [
  'SOURCED',
  'CONTACTED',
  'OFFERED',
  'ACQUIRED',
  'RECONDITIONING',
  'LISTED',
  'SOLD',
  'LOST',
];

export default function DealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [deal, setDeal] = useState<DealWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/deals/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDeal(data);
      } else {
        router.push('/deals');
      }
    } catch (error) {
      console.error('Failed to fetch deal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!deal) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchDeal();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleGetAiValuation = async () => {
    if (!deal) return;
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai/valuation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id }),
      });
      if (response.ok) {
        fetchDeal();
      }
    } catch (error) {
      console.error('Failed to get AI valuation:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetAiSummary = async () => {
    if (!deal) return;
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id }),
      });
      if (response.ok) {
        fetchDeal();
      }
    } catch (error) {
      console.error('Failed to get AI summary:', error);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </MainLayout>
    );
  }

  if (!deal) return null;

  const vehicle = deal.vehicle;
  const title = generateVehicleTitle(vehicle);
  const daysInStock = calculateDaysInStock(deal.acquiredAt);
  const latestSummary = deal.aiInsights?.find((i) => i.type === 'SUMMARY');

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Deals
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${getDealStatusColor(deal.status)}`}>
                {getDealStatusLabel(deal.status)}
              </span>
              {deal.aiRecommendation && (
                <span className={`text-sm font-medium px-3 py-1 rounded-full border ${getRecommendationColor(deal.aiRecommendation)}`}>
                  {getRecommendationLabel(deal.aiRecommendation)}
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-1">Added {formatRelativeTime(deal.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleGetAiValuation} loading={aiLoading}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Get AI Valuation
            </Button>
            <Button variant="outline" onClick={handleGetAiSummary} loading={aiLoading}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Summary
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Make / Model</p>
                      <p className="font-medium text-slate-900">{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Year</p>
                      <p className="font-medium text-slate-900">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Variant</p>
                      <p className="font-medium text-slate-900">{vehicle.variant || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Odometer</p>
                      <p className="font-medium text-slate-900">{vehicle.odometer ? `${formatNumber(vehicle.odometer)} km` : '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Transmission</p>
                      <p className="font-medium text-slate-900">{vehicle.transmission || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Fuel Type</p>
                      <p className="font-medium text-slate-900">{vehicle.fuelType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Body Type</p>
                      <p className="font-medium text-slate-900">{vehicle.bodyType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Colour</p>
                      <p className="font-medium text-slate-900">{vehicle.colour || '-'}</p>
                    </div>
                  </div>
                </div>
                {deal.sourceUrl && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <a
                      href={deal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                      View Original Listing
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Summary */}
            {latestSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Deal Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">{latestSummary.content}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    Generated {formatRelativeTime(latestSummary.createdAt)} using {latestSummary.model || 'GPT-4'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Button size="sm" variant="outline">Add Note</Button>
              </CardHeader>
              <CardContent>
                {deal.notes && deal.notes.length > 0 ? (
                  <div className="space-y-4">
                    {deal.notes.map((note) => (
                      <div key={note.id} className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-700">{note.content}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {note.author.name} • {formatRelativeTime(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No notes yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        deal.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {getDealStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Asking Price</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(deal.askPrice)}</p>
                  </div>
                  {deal.estimatedFairValueLow && deal.estimatedFairValueHigh && (
                    <div>
                      <p className="text-sm text-slate-500">Fair Value Range</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(deal.estimatedFairValueLow)} - {formatCurrency(deal.estimatedFairValueHigh)}
                      </p>
                    </div>
                  )}
                  {deal.estimatedTargetSellPrice && (
                    <div>
                      <p className="text-sm text-slate-500">Target Sell Price</p>
                      <p className="font-semibold text-green-600">{formatCurrency(deal.estimatedTargetSellPrice)}</p>
                    </div>
                  )}
                  {deal.estimatedMargin && (
                    <div>
                      <p className="text-sm text-slate-500">Estimated Margin</p>
                      <p className="font-semibold text-green-600">{deal.estimatedMargin.toFixed(1)}%</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-100">
                    {deal.actualPurchasePrice && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-500">Actual Purchase</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(deal.actualPurchasePrice)}</p>
                      </div>
                    )}
                    {deal.actualSellPrice && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-500">Actual Sale</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(deal.actualSellPrice)}</p>
                      </div>
                    )}
                    {deal.reconditioningCost && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-500">Reconditioning</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(deal.reconditioningCost)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Risk & Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deal.riskScore !== null && deal.riskScore !== undefined && (
                    <div>
                      <p className="text-sm text-slate-500">Risk Score</p>
                      <p className={`font-semibold ${getRiskColor(deal.riskScore)}`}>
                        {deal.riskScore}/100 ({deal.riskScore <= 30 ? 'Low' : deal.riskScore <= 60 ? 'Medium' : 'High'})
                      </p>
                    </div>
                  )}
                  {deal.estimatedDaysToSell && (
                    <div>
                      <p className="text-sm text-slate-500">Est. Days to Sell</p>
                      <p className="font-semibold text-slate-900">{deal.estimatedDaysToSell} days</p>
                    </div>
                  )}
                  {daysInStock !== null && (
                    <div>
                      <p className="text-sm text-slate-500">Days in Stock</p>
                      <p className="font-semibold text-slate-900">{daysInStock} days</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acquired</span>
                      <span className="text-slate-900">{formatDate(deal.acquiredAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Listed</span>
                      <span className="text-slate-900">{formatDate(deal.listedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sold</span>
                      <span className="text-slate-900">{formatDate(deal.soldAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
