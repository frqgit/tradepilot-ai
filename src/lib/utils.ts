import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = 'AUD'): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '-';
  return new Intl.NumberFormat('en-AU').format(num);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-';
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

export function calculateDaysInStock(acquiredAt: Date | string | null | undefined): number | null {
  if (!acquiredAt) return null;
  const now = new Date();
  const acquired = new Date(acquiredAt);
  return Math.floor((now.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateMarginPercent(
  purchasePrice: number | null | undefined,
  sellPrice: number | null | undefined,
  costs: number = 0
): number | null {
  if (!purchasePrice || !sellPrice) return null;
  const profit = sellPrice - purchasePrice - costs;
  return (profit / purchasePrice) * 100;
}

export function getRiskColor(riskScore: number | null | undefined): string {
  if (riskScore == null) return 'text-gray-400';
  if (riskScore <= 30) return 'text-green-500';
  if (riskScore <= 60) return 'text-yellow-500';
  return 'text-red-500';
}

export function getRecommendationColor(recommendation: string | null | undefined): string {
  switch (recommendation) {
    case 'STRONG_BUY':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'MAYBE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'SKIP':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getRecommendationLabel(recommendation: string | null | undefined): string {
  switch (recommendation) {
    case 'STRONG_BUY':
      return 'Strong Buy';
    case 'MAYBE':
      return 'Maybe';
    case 'SKIP':
      return 'Skip';
    default:
      return 'Pending';
  }
}

export function getDealStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SOURCED: 'bg-slate-100 text-slate-700',
    CONTACTED: 'bg-blue-100 text-blue-700',
    OFFERED: 'bg-purple-100 text-purple-700',
    ACQUIRED: 'bg-green-100 text-green-700',
    RECONDITIONING: 'bg-orange-100 text-orange-700',
    LISTED: 'bg-cyan-100 text-cyan-700',
    SOLD: 'bg-emerald-100 text-emerald-700',
    LOST: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getDealStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SOURCED: 'Sourced',
    CONTACTED: 'Contacted',
    OFFERED: 'Offered',
    ACQUIRED: 'Acquired',
    RECONDITIONING: 'Reconditioning',
    LISTED: 'Listed',
    SOLD: 'Sold',
    LOST: 'Lost',
  };
  return labels[status] || status;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateVehicleTitle(vehicle: {
  year: number;
  make: string;
  model: string;
  variant?: string | null;
}): string {
  const parts = [vehicle.year, vehicle.make, vehicle.model];
  if (vehicle.variant) parts.push(vehicle.variant);
  return parts.join(' ');
}
