import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsageStats, PLAN_CONFIG, PlanType } from '@/lib/subscription';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    // Get usage stats
    const usageStats = await getUsageStats(organizationId);
    
    // Get organization details
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });
    
    const plan = (org?.plan as PlanType) || 'FREE';
    const planConfig = PLAN_CONFIG[plan];
    
    return NextResponse.json({
      plan,
      planName: planConfig.name,
      price: planConfig.price,
      features: planConfig.features,
      usage: {
        today: usageStats.today,
        thisWeek: usageStats.thisWeek,
        thisMonth: usageStats.thisMonth,
        dailyLimit: usageStats.dailyLimit,
        remaining: usageStats.remaining,
        isUnlimited: usageStats.dailyLimit === -1,
      },
      subscription: org?.subscription ? {
        status: org.subscription.status,
        renewalDate: org.subscription.renewalDate,
      } : null,
      allPlans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
        id: key,
        name: config.name,
        price: config.price,
        features: config.features,
        analysisLimit: config.analysisLimit,
        color: config.color,
        isCurrent: key === plan,
      })),
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
