'use client';

import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import {
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  getRecommendationColor,
  getRecommendationLabel,
  getDealStatusColor,
  getDealStatusLabel,
  generateVehicleTitle,
  getRiskColor,
} from '@/lib/utils';
import type { DealWithRelations } from '@/types';

interface DealCardProps {
  deal: DealWithRelations;
}

export default function DealCard({ deal }: DealCardProps) {
  const vehicle = deal.vehicle;
  const title = generateVehicleTitle(vehicle);

  return (
    <Card hoverable className="overflow-hidden">
      <Link href={`/deals/${deal.id}`}>
        <div className="flex">
          {/* Image placeholder */}
          <div className="w-48 h-36 bg-slate-200 flex-shrink-0 flex items-center justify-center">
            {vehicle.imageUrls?.[0] ? (
              <img
                src={vehicle.imageUrls[0]}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  {vehicle.odometer && (
                    <span>{formatNumber(vehicle.odometer)} km</span>
                  )}
                  {vehicle.transmission && (
                    <>
                      <span>•</span>
                      <span>{vehicle.transmission}</span>
                    </>
                  )}
                  {vehicle.fuelType && (
                    <>
                      <span>•</span>
                      <span>{vehicle.fuelType}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDealStatusColor(deal.status)}`}>
                  {getDealStatusLabel(deal.status)}
                </span>
                {deal.aiRecommendation && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getRecommendationColor(deal.aiRecommendation)}`}>
                    {getRecommendationLabel(deal.aiRecommendation)}
                  </span>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-4 flex items-end justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-slate-500">Asking</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(deal.askPrice)}</p>
                </div>
                {deal.estimatedFairValueLow && deal.estimatedFairValueHigh && (
                  <div>
                    <p className="text-xs text-slate-500">Fair Value</p>
                    <p className="font-medium text-slate-700">
                      {formatCurrency(deal.estimatedFairValueLow)} - {formatCurrency(deal.estimatedFairValueHigh)}
                    </p>
                  </div>
                )}
                {deal.estimatedMargin && (
                  <div>
                    <p className="text-xs text-slate-500">Est. Margin</p>
                    <p className="font-semibold text-green-600">{deal.estimatedMargin.toFixed(1)}%</p>
                  </div>
                )}
                {deal.riskScore !== null && deal.riskScore !== undefined && (
                  <div>
                    <p className="text-xs text-slate-500">Risk</p>
                    <p className={`font-medium ${getRiskColor(deal.riskScore)}`}>
                      {deal.riskScore <= 30 ? 'Low' : deal.riskScore <= 60 ? 'Medium' : 'High'}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400">{formatRelativeTime(deal.createdAt)}</p>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
