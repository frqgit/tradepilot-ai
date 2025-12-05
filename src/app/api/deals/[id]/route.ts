import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateDealSchema = z.object({
  status: z.enum(['SOURCED', 'CONTACTED', 'OFFERED', 'ACQUIRED', 'RECONDITIONING', 'LISTED', 'SOLD', 'LOST']).optional(),
  askPrice: z.number().positive().optional(),
  negotiatedPrice: z.number().positive().optional(),
  actualPurchasePrice: z.number().positive().optional(),
  actualSellPrice: z.number().positive().optional(),
  reconditioningCost: z.number().min(0).optional(),
  otherCosts: z.number().min(0).optional(),
});

// GET /api/deals/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deal = await prisma.deal.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        vehicle: true,
        dealContacts: {
          include: { contact: true },
        },
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
        aiInsights: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

// PATCH /api/deals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateDealSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify deal belongs to organization
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const updateData: any = { ...validation.data };

    // Set timestamps based on status changes
    if (validation.data.status === 'ACQUIRED' && !existingDeal.acquiredAt) {
      updateData.acquiredAt = new Date();
    }
    if (validation.data.status === 'LISTED' && !existingDeal.listedAt) {
      updateData.listedAt = new Date();
    }
    if (validation.data.status === 'SOLD' && !existingDeal.soldAt) {
      updateData.soldAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

// DELETE /api/deals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify deal belongs to organization
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Delete deal (vehicle will be orphaned, could add cleanup logic)
    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
