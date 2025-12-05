import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, organizationName } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Create default AI preferences
      await tx.aiPreferences.create({
        data: {
          userId: user.id,
        },
      });

      // Create free subscription
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating your account' },
      { status: 500 }
    );
  }
}
