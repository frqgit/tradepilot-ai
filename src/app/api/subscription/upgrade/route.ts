import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateOrganizationPlan, PLAN_CONFIG, PlanType } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !PLAN_CONFIG[plan as PlanType]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const selectedPlan = plan as PlanType;
    const planConfig = PLAN_CONFIG[selectedPlan];

    // For now, we'll just update the plan directly
    // In production, this would integrate with Stripe for payment
    if (planConfig.price > 0) {
      // In production, you would:
      // 1. Create/update Stripe customer
      // 2. Create Stripe checkout session or subscription
      // 3. Only update plan after successful payment via webhook
      
      // For MVP, we'll simulate successful upgrade
      console.log(`[Subscription] Simulating payment for ${selectedPlan} plan - $${planConfig.price}/month`);
    }

    // Update the organization's plan
    await updateOrganizationPlan(organizationId, selectedPlan);

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planConfig.name} plan`,
      plan: selectedPlan,
      planName: planConfig.name,
      price: planConfig.price,
      // In production, include checkout URL for paid plans
      // checkoutUrl: stripeCheckoutSession.url,
    });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
