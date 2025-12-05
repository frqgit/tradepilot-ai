import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const createDealSchema = z.object({
  sourceUrl: z.string().url().optional(),
  sourceSite: z.string().optional(),
  vehicle: z.object({
    year: z.number().min(1900).max(2030),
    make: z.string().min(1),
    model: z.string().min(1),
    variant: z.string().optional(),
    odometer: z.number().optional(),
    transmission: z.enum(['AUTOMATIC', 'MANUAL', 'CVT', 'DCT', 'OTHER']).optional(),
    fuelType: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG', 'OTHER']).optional(),
    bodyType: z.enum(['SEDAN', 'HATCHBACK', 'SUV', 'WAGON', 'UTE', 'COUPE', 'CONVERTIBLE', 'VAN', 'OTHER']).optional(),
    colour: z.string().optional(),
    imageUrls: z.array(z.string()).optional(),
  }),
  askPrice: z.number().positive().optional(),
});

// GET /api/deals - List deals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const recommendation = searchParams.get('recommendation');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const deals = await prisma.deal.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(status && { status: status as any }),
        ...(recommendation && { aiRecommendation: recommendation as any }),
      },
      include: {
        vehicle: true,
        dealContacts: {
          include: { contact: true },
        },
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        aiInsights: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// POST /api/deals - Create deal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createDealSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { sourceUrl, sourceSite, vehicle, askPrice } = validation.data;

    // Create vehicle and deal in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      const newVehicle = await tx.vehicle.create({
        data: {
          organizationId: session.user.organizationId,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          variant: vehicle.variant,
          odometer: vehicle.odometer,
          transmission: vehicle.transmission as any,
          fuelType: vehicle.fuelType as any,
          bodyType: vehicle.bodyType as any,
          colour: vehicle.colour,
          imageUrls: vehicle.imageUrls || [],
        },
      });

      const newDeal = await tx.deal.create({
        data: {
          organizationId: session.user.organizationId,
          vehicleId: newVehicle.id,
          sourceUrl,
          sourceSite,
          askPrice,
          status: 'SOURCED',
        },
        include: {
          vehicle: true,
        },
      });

      return newDeal;
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
