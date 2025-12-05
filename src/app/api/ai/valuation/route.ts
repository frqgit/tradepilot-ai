import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { getAiValuation } from '@/lib/ai';

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

    // Get AI valuation
    const valuation = await getAiValuation({
      vehicle: deal.vehicle,
      askPrice: deal.askPrice,
    });

    // Update deal with valuation results
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        estimatedFairValueLow: valuation.fairValueLow,
        estimatedFairValueHigh: valuation.fairValueHigh,
        estimatedTargetSellPrice: valuation.targetSellPrice,
        estimatedMargin: valuation.estimatedMargin,
        estimatedDaysToSell: valuation.estimatedDaysToSell,
        riskScore: valuation.riskScore,
        aiRecommendation: valuation.recommendation,
      },
    });

    // Store AI insight
    await prisma.aiInsight.create({
      data: {
        dealId,
        type: 'PRICING_EXPLANATION',
        content: valuation.reasoning,
        model: 'gpt-4-turbo-preview',
      },
    });

    return NextResponse.json({
      valuation,
      deal: updatedDeal,
    });
  } catch (error) {
    console.error('AI Valuation error:', error);
    return NextResponse.json({ error: 'Failed to get valuation' }, { status: 500 });
  }
}
