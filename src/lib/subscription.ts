import { prisma } from '@/lib/db';
import { UsageRecord } from '@prisma/client';

// Plan configuration with limits
export const PLAN_CONFIG = {
  FREE: {
    name: 'Free',
    price: 0,
    analysisLimit: 3,
    features: [
      '3 market analyses per day',
      'Basic AI valuation',
      'Deal pipeline access',
      'Email support',
    ],
    color: 'slate',
  },
  BASIC: {
    name: 'Basic',
    price: 5,
    analysisLimit: 10,
    features: [
      '10 market analyses per day',
      'Advanced AI valuation',
      'Deal pipeline access',
      'Real-time web scraping',
      'Priority email support',
    ],
    color: 'blue',
  },
  PREMIUM: {
    name: 'Premium',
    price: 10,
    analysisLimit: 100,
    features: [
      '100 market analyses per day',
      'Advanced AI valuation',
      'Deal pipeline access',
      'Real-time web scraping',
      'Market insights & trends',
      'Priority support',
    ],
    color: 'purple',
  },
  BUSINESS: {
    name: 'Business Dealer',
    price: 30,
    analysisLimit: -1, // Unlimited
    features: [
      'Unlimited market analyses',
      'Advanced AI valuation',
      'Deal pipeline access',
      'Real-time web scraping',
      'Market insights & trends',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
    ],
    color: 'amber',
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;

/**
 * Get today's date at midnight (UTC) for usage tracking
 */
export function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Get the organization's current plan
 */
export async function getOrganizationPlan(organizationId: string): Promise<PlanType> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  });
  return (org?.plan as PlanType) || 'FREE';
}

/**
 * Get today's usage count for an organization
 */
export async function getTodayUsage(organizationId: string): Promise<number> {
  const today = getTodayDate();
  
  const usage = await prisma.usageRecord.findUnique({
    where: {
      organizationId_date: {
        organizationId,
        date: today,
      },
    },
  });
  
  return usage?.analysisCount || 0;
}

/**
 * Check if organization can perform an analysis (hasn't exceeded daily limit)
 */
export async function canPerformAnalysis(organizationId: string): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit: number;
  plan: PlanType;
  remaining: number;
}> {
  const plan = await getOrganizationPlan(organizationId);
  const currentUsage = await getTodayUsage(organizationId);
  const limit = PLAN_CONFIG[plan].analysisLimit;
  
  // Unlimited plan (-1)
  if (limit === -1) {
    return {
      allowed: true,
      currentUsage,
      limit: -1,
      plan,
      remaining: -1,
    };
  }
  
  const remaining = Math.max(0, limit - currentUsage);
  
  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    plan,
    remaining,
  };
}

/**
 * Increment the usage count for an organization
 */
export async function incrementUsage(organizationId: string): Promise<number> {
  const today = getTodayDate();
  
  const usage = await prisma.usageRecord.upsert({
    where: {
      organizationId_date: {
        organizationId,
        date: today,
      },
    },
    update: {
      analysisCount: { increment: 1 },
    },
    create: {
      organizationId,
      date: today,
      analysisCount: 1,
    },
  });
  
  return usage.analysisCount;
}

/**
 * Get usage statistics for the current billing period
 */
export async function getUsageStats(organizationId: string): Promise<{
  today: number;
  thisWeek: number;
  thisMonth: number;
  plan: PlanType;
  dailyLimit: number;
  remaining: number;
}> {
  const plan = await getOrganizationPlan(organizationId);
  const today = getTodayDate();
  
  // Get date ranges
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  // Fetch all usage records for the month
  const usageRecords = await prisma.usageRecord.findMany({
    where: {
      organizationId,
      date: { gte: monthAgo },
    },
    orderBy: { date: 'desc' },
  });
  
  // Calculate stats
  const todayRecord = usageRecords.find(
    (r: UsageRecord) => r.date.getTime() === today.getTime()
  );
  const todayUsage = todayRecord?.analysisCount || 0;
  
  const weekUsage = usageRecords
    .filter((r: UsageRecord) => r.date >= weekAgo)
    .reduce((sum: number, r: UsageRecord) => sum + r.analysisCount, 0);
  
  const monthUsage = usageRecords.reduce((sum: number, r: UsageRecord) => sum + r.analysisCount, 0);
  
  const dailyLimit = PLAN_CONFIG[plan].analysisLimit;
  const remaining = dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - todayUsage);
  
  return {
    today: todayUsage,
    thisWeek: weekUsage,
    thisMonth: monthUsage,
    plan,
    dailyLimit,
    remaining,
  };
}

/**
 * Update organization plan
 */
export async function updateOrganizationPlan(
  organizationId: string,
  newPlan: PlanType
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan: newPlan },
  });
  
  // Also update/create subscription record
  await prisma.subscription.upsert({
    where: { organizationId },
    update: { plan: newPlan },
    create: {
      organizationId,
      plan: newPlan,
      status: 'ACTIVE',
    },
  });
}
