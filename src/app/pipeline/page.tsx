'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import {
  formatCurrency,
  formatNumber,
  generateVehicleTitle,
  getDealStatusLabel,
  getRecommendationColor,
  getRecommendationLabel,
  calculateDaysInStock,
} from '@/lib/utils';
import type { DealWithRelations } from '@/types';

const columns = [
  { id: 'SOURCED', title: 'Sourced', color: 'bg-slate-500' },
  { id: 'CONTACTED', title: 'Contacted', color: 'bg-blue-500' },
  { id: 'OFFERED', title: 'Offered', color: 'bg-purple-500' },
  { id: 'ACQUIRED', title: 'Acquired', color: 'bg-green-500' },
  { id: 'RECONDITIONING', title: 'Reconditioning', color: 'bg-orange-500' },
  { id: 'LISTED', title: 'Listed', color: 'bg-cyan-500' },
];

export default function PipelinePage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals');
      const data = await response.json();
      // Filter out SOLD and LOST for pipeline view
      setDeals(data.filter((d: any) => !['SOLD', 'LOST'].includes(d.status)));
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDragging(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    setDragging(null);

    if (!dealId) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId ? { ...deal, status: newStatus as any } : deal
      )
    );

    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Failed to update deal:', error);
      fetchDeals(); // Revert on error
    }
  };

  const getDealsForColumn = (status: string) => {
    return deals.filter((deal) => deal.status === status);
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

  return (
    <MainLayout>
      <div className="p-8 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-500 mt-1">Drag and drop deals between stages</p>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnDeals = getDealsForColumn(column.id);
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 flex flex-col bg-slate-100 rounded-xl"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-slate-700">{column.title}</h3>
                  </div>
                  <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full">
                    {columnDeals.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-3 overflow-y-auto min-h-[200px]">
                  {columnDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow ${
                        dragging === deal.id ? 'opacity-50' : ''
                      }`}
                    >
                      <h4 className="font-medium text-slate-900 text-sm">
                        {generateVehicleTitle(deal.vehicle)}
                      </h4>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        {deal.vehicle.odometer && (
                          <span>{formatNumber(deal.vehicle.odometer)} km</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(deal.askPrice)}
                        </span>
                        {deal.aiRecommendation && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getRecommendationColor(deal.aiRecommendation)}`}>
                            {getRecommendationLabel(deal.aiRecommendation)}
                          </span>
                        )}
                      </div>
                      {deal.estimatedMargin && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Est. Margin</span>
                          <span className="text-green-600 font-medium">{deal.estimatedMargin.toFixed(1)}%</span>
                        </div>
                      )}
                      {deal.acquiredAt && (
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Days in Stock</span>
                          <span className="text-slate-700 font-medium">{calculateDaysInStock(deal.acquiredAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {columnDeals.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
