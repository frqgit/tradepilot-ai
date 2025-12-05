import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { getAiDealSummary } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await request.json();

    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    // Fetch the deal with vehicle
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        organizationId: session.user.organizationId,
      },
      include: { vehicle: true },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Get AI summary
    const summary = await getAiDealSummary({
      vehicle: deal.vehicle,
      askPrice: deal.askPrice,
      fairValueLow: deal.estimatedFairValueLow,
      fairValueHigh: deal.estimatedFairValueHigh,
      estimatedMargin: deal.estimatedMargin,
      riskScore: deal.riskScore,
    });

    // Store AI insight
    const insight = await prisma.aiInsight.create({
      data: {
        dealId,
        type: 'SUMMARY',
        content: summary,
        model: 'gpt-4-turbo-preview',
      },
    });

    return NextResponse.json({
      summary,
      insight,
    });
  } catch (error) {
    console.error('AI Summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
