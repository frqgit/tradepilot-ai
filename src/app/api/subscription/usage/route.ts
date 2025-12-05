import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canPerformAnalysis, PLAN_CONFIG } from '@/lib/subscription';

// Check current usage limits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const usageCheck = await canPerformAnalysis(organizationId);
    const planConfig = PLAN_CONFIG[usageCheck.plan];

    return NextResponse.json({
      allowed: usageCheck.allowed,
      currentUsage: usageCheck.currentUsage,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      isUnlimited: usageCheck.limit === -1,
      plan: usageCheck.plan,
      planName: planConfig.name,
      message: usageCheck.allowed
        ? usageCheck.limit === -1
          ? 'Unlimited analyses available'
          : `${usageCheck.remaining} analyses remaining today`
        : `Daily limit reached. Upgrade to get more analyses.`,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}
