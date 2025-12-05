'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface DashboardStats {
  totalDealsReviewed: number;
  totalDealsBought: number;
  totalDealsSold: number;
  winRate: number;
  averageGrossMargin: number;
  averageDaysInStock: number;
  totalProfit: number;
  activeDeals: number;
  dealsByStatus: Record<string, number>;
  dealsByRecommendation: Record<string, number>;
  recentDeals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  const statCards = [
    {
      title: 'Total Deals Reviewed',
      value: stats?.totalDealsReviewed || 0,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Deals Bought',
      value: stats?.totalDealsBought || 0,
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Deals Sold',
      value: stats?.totalDealsSold || 0,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Active Deals',
      value: stats?.activeDeals || 0,
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const performanceCards = [
    {
      title: 'Win Rate',
      value: `${stats?.winRate || 0}%`,
      description: 'Sold / Bought',
      trend: (stats?.winRate || 0) >= 70 ? 'up' : 'down',
    },
    {
      title: 'Avg. Gross Margin',
      value: `${stats?.averageGrossMargin || 0}%`,
      description: 'On sold deals',
      trend: (stats?.averageGrossMargin || 0) >= 15 ? 'up' : 'down',
    },
    {
      title: 'Avg. Days in Stock',
      value: stats?.averageDaysInStock || 0,
      description: 'Until sold',
      trend: (stats?.averageDaysInStock || 0) <= 30 ? 'up' : 'down',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(stats?.totalProfit || 0),
      description: 'All time',
      trend: 'up',
    },
  ];

  const statusLabels: Record<string, string> = {
    SOURCED: 'Sourced',
    CONTACTED: 'Contacted',
    OFFERED: 'Offered',
    ACQUIRED: 'Acquired',
    RECONDITIONING: 'Reconditioning',
    LISTED: 'Listed',
    SOLD: 'Sold',
    LOST: 'Lost',
  };

  const recommendationLabels: Record<string, { label: string; color: string }> = {
    STRONG_BUY: { label: 'Strong Buy', color: 'bg-green-500' },
    MAYBE: { label: 'Maybe', color: 'bg-yellow-500' },
    SKIP: { label: 'Skip', color: 'bg-red-500' },
    PENDING: { label: 'Pending', color: 'bg-gray-400' },
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your trading performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-4 py-6">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <svg className={`w-6 h-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {performanceCards.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">{metric.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    metric.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {metric.trend === 'up' ? '↑ Good' : '↓ Needs work'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="text-xs text-slate-400 mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Deals by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Deals by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.dealsByStatus || {}).map(([status, count]) => {
                  const total = stats?.totalDealsReviewed || 1;
                  const percentage = (count / total) * 100;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{statusLabels[status] || status}</span>
                        <span className="font-medium text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(stats?.dealsByStatus || {}).length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No deals yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats?.dealsByRecommendation || {}).map(([rec, count]) => {
                  const config = recommendationLabels[rec] || { label: rec, color: 'bg-gray-400' };
                  const total = stats?.totalDealsReviewed || 1;
                  const percentage = (count / total) * 100;
                  return (
                    <div key={rec} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{config.label}</span>
                          <span className="font-medium text-slate-900">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${config.color} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(stats?.dealsByRecommendation || {}).length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No AI recommendations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Recent Activity</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {stats?.recentDeals || 0} deals added in the last 7 days
                  </p>
                </div>
                <a
                  href="/deals"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  View all deals
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
