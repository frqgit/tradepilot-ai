'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  analysisLimit: number;
  color: string;
  isCurrent: boolean;
}

interface SubscriptionData {
  plan: string;
  planName: string;
  price: number;
  features: string[];
  usage: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    dailyLimit: number;
    remaining: number;
    isUnlimited: boolean;
  };
  subscription: {
    status: string;
    renewalDate: string | null;
  } | null;
  allPlans: Plan[];
}

interface Preferences {
  targetMarginPercent: number;
  maxDaysInStock: number;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  negotiationTone: 'POLITE' | 'FIRM' | 'URGENT' | 'CASUAL';
}

interface UserInfo {
  name: string;
  email: string;
}

const riskToleranceOptions = [
  { value: 'LOW', label: 'Low - Conservative, prefer safe deals' },
  { value: 'MEDIUM', label: 'Medium - Balanced approach' },
  { value: 'HIGH', label: 'High - Willing to take risks for higher returns' },
];

const negotiationToneOptions = [
  { value: 'POLITE', label: 'Polite - Friendly and courteous' },
  { value: 'FIRM', label: 'Firm - Direct and business-like' },
  { value: 'URGENT', label: 'Urgent - Time-sensitive offers' },
  { value: 'CASUAL', label: 'Casual - Relaxed and informal' },
];

const planColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
};

export default function SettingsPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '' });
  const [preferences, setPreferences] = useState<Preferences>({
    targetMarginPercent: 15,
    maxDaysInStock: 45,
    riskTolerance: 'MEDIUM',
    negotiationTone: 'POLITE',
  });
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'preferences' | 'subscription'>('preferences');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prefsResponse, subResponse] = await Promise.all([
          fetch('/api/settings/preferences'),
          fetch('/api/subscription'),
        ]);
        
        if (prefsResponse.ok) {
          const data = await prefsResponse.json();
          setPreferences({
            targetMarginPercent: data.targetMarginPercent,
            maxDaysInStock: data.maxDaysInStock,
            riskTolerance: data.riskTolerance,
            negotiationTone: data.negotiationTone,
          });
          if (data.user) {
            setUserInfo({
              name: data.user.name || '',
              email: data.user.email || '',
            });
          }
        }
        
        if (subResponse.ok) {
          const subData = await subResponse.json();
          setSubscriptionData(subData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    setMessage('');

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Successfully upgraded to ${data.planName}!`);
        // Refresh subscription data
        const subResponse = await fetch('/api/subscription');
        if (subResponse.ok) {
          setSubscriptionData(await subResponse.json());
        }
      } else {
        setMessage(data.error || 'Failed to upgrade plan');
      }
    } catch (error) {
      setMessage('An error occurred during upgrade');
    } finally {
      setUpgrading(null);
      setTimeout(() => setMessage(''), 5000);
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

  const usage = subscriptionData?.usage;
  const usagePercent = usage && !usage.isUnlimited 
    ? Math.min(100, (usage.today / usage.dailyLimit) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account, subscription, and AI preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium">
                {userInfo.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-slate-900">{userInfo.name || 'User'}</p>
                <p className="text-slate-500">{userInfo.email}</p>
                {subscriptionData && (
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${planColors[subscriptionData.allPlans.find(p => p.isCurrent)?.color || 'slate']?.badge}`}>
                    {subscriptionData.planName} Plan
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            AI Preferences
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'subscription'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Subscription & Usage
          </button>
        </div>

        {activeTab === 'preferences' && (
          <>
            {/* AI Preferences */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>AI Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Margin (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={preferences.targetMarginPercent}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          targetMarginPercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Minimum profit margin you want on deals
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Max Days in Stock
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={preferences.maxDaysInStock}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          maxDaysInStock: parseInt(e.target.value) || 45,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Maximum days you want a car in stock before selling
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Risk Tolerance
                  </label>
                  <select
                    value={preferences.riskTolerance}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        riskTolerance: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {riskToleranceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    How much risk are you comfortable with for AI recommendations
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Negotiation Tone
                  </label>
                  <select
                    value={preferences.negotiationTone}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        negotiationTone: e.target.value as 'POLITE' | 'FIRM' | 'URGENT' | 'CASUAL',
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {negotiationToneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Default tone for AI-generated messages
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} loading={saving}>
                Save Settings
              </Button>
              {message && (
                <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </span>
              )}
            </div>
          </>
        )}

        {activeTab === 'subscription' && subscriptionData && (
          <>
            {/* Current Usage */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Today&apos;s Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {usage?.isUnlimited ? (
                          <span>∞</span>
                        ) : (
                          <>
                            {usage?.today} <span className="text-slate-400 font-normal text-lg">/ {usage?.dailyLimit}</span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">Analyses used today</p>
                    </div>
                    <div className="text-right">
                      {usage?.isUnlimited ? (
                        <span className="text-green-600 font-medium">Unlimited</span>
                      ) : (
                        <span className={`font-medium ${usage?.remaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {usage?.remaining} remaining
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!usage?.isUnlimited && (
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">This Week</p>
                      <p className="font-semibold text-slate-900">{usage?.thisWeek}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">This Month</p>
                      <p className="font-semibold text-slate-900">{usage?.thisMonth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Current Plan</p>
                      <p className="font-semibold text-slate-900">{subscriptionData.planName}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plans */}
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {subscriptionData.allPlans.map((plan) => {
                const colors = planColors[plan.color] || planColors.slate;
                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all ${
                      plan.isCurrent
                        ? `ring-2 ring-blue-500 ${colors.bg}`
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {plan.isCurrent && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-bl">
                        Current
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h4 className={`font-semibold text-lg ${colors.text}`}>{plan.name}</h4>
                      <div className="mt-2 mb-4">
                        <span className="text-3xl font-bold text-slate-900">
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                        </span>
                        {plan.price > 0 && <span className="text-slate-500 text-sm">/month</span>}
                      </div>
                      
                      <div className={`text-sm font-medium mb-4 ${colors.text}`}>
                        {plan.analysisLimit === -1 ? 'Unlimited' : plan.analysisLimit} analyses/day
                      </div>
                      
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {plan.isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          variant={plan.price > (subscriptionData.price || 0) ? 'primary' : 'outline'}
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                          loading={upgrading === plan.id}
                        >
                          {plan.price === 0 
                            ? 'Downgrade' 
                            : plan.price > (subscriptionData.price || 0) 
                              ? 'Upgrade' 
                              : 'Switch'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {message && (
              <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}

            {/* Billing Info */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  {subscriptionData.price === 0 ? (
                    "You're on the free plan. Upgrade to unlock more analyses and features."
                  ) : (
                    <>
                      Your subscription is <span className="font-medium text-green-600">{subscriptionData.subscription?.status?.toLowerCase()}</span>.
                      {subscriptionData.subscription?.renewalDate && (
                        <> Next billing date: {new Date(subscriptionData.subscription.renewalDate).toLocaleDateString()}</>
                      )}
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  💡 For production, this would integrate with Stripe for secure payment processing.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
