import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { getAiMessageTemplate } from '@/lib/ai';
import { z } from 'zod';

const messageSchema = z.object({
  dealId: z.string(),
  messageType: z.enum(['inquiry', 'offer', 'followup']),
  tone: z.enum(['polite', 'firm', 'urgent', 'casual']).optional(),
  sellerName: z.string().optional(),
  offerAmount: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = messageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { dealId, messageType, tone, sellerName, offerAmount } = validation.data;

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

    // Get AI message
    const message = await getAiMessageTemplate({
      vehicle: deal.vehicle,
      askPrice: deal.askPrice,
      recommendedOffer: offerAmount,
      messageType,
      tone: tone || 'polite',
      sellerName,
    });

    // Store as AI insight
    await prisma.aiInsight.create({
      data: {
        dealId,
        type: 'MESSAGE_TEMPLATE',
        content: message,
        model: 'gpt-4-turbo-preview',
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('AI Message error:', error);
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
  }
}
