import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // Get all deals for the organization
    const deals = await prisma.deal.findMany({
      where: { organizationId: orgId },
    });

    // Calculate stats
    const totalDealsReviewed = deals.length;
    const boughtDeals = deals.filter((d) => ['ACQUIRED', 'RECONDITIONING', 'LISTED', 'SOLD'].includes(d.status));
    const soldDeals = deals.filter((d) => d.status === 'SOLD');
    const activeDeals = deals.filter((d) => !['SOLD', 'LOST'].includes(d.status));

    const totalDealsBought = boughtDeals.length;
    const totalDealsSold = soldDeals.length;

    // Win rate (sold / bought)
    const winRate = totalDealsBought > 0 ? (totalDealsSold / totalDealsBought) * 100 : 0;

    // Average margin from sold deals
    const marginsFromSold = soldDeals
      .filter((d) => d.actualPurchasePrice && d.actualSellPrice)
      .map((d) => {
        const costs = (d.reconditioningCost || 0) + (d.otherCosts || 0);
        const profit = d.actualSellPrice! - d.actualPurchasePrice! - costs;
        return (profit / d.actualPurchasePrice!) * 100;
      });
    const averageGrossMargin = marginsFromSold.length > 0
      ? marginsFromSold.reduce((a, b) => a + b, 0) / marginsFromSold.length
      : 0;

    // Total profit from sold deals
    const totalProfit = soldDeals
      .filter((d) => d.actualPurchasePrice && d.actualSellPrice)
      .reduce((sum, d) => {
        const costs = (d.reconditioningCost || 0) + (d.otherCosts || 0);
        return sum + (d.actualSellPrice! - d.actualPurchasePrice! - costs);
      }, 0);

    // Average days in stock for sold deals
    const daysInStock = soldDeals
      .filter((d) => d.acquiredAt && d.soldAt)
      .map((d) => {
        const acquired = new Date(d.acquiredAt!);
        const sold = new Date(d.soldAt!);
        return Math.floor((sold.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24));
      });
    const averageDaysInStock = daysInStock.length > 0
      ? daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length
      : 0;

    // Deals by status
    const dealsByStatus = deals.reduce((acc, deal) => {
      acc[deal.status] = (acc[deal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Deals by recommendation
    const dealsByRecommendation = deals.reduce((acc, deal) => {
      const key = deal.aiRecommendation || 'PENDING';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDeals = deals.filter((d) => new Date(d.createdAt) >= sevenDaysAgo).length;

    return NextResponse.json({
      totalDealsReviewed,
      totalDealsBought,
      totalDealsSold,
      winRate: Math.round(winRate * 10) / 10,
      averageGrossMargin: Math.round(averageGrossMargin * 10) / 10,
      averageDaysInStock: Math.round(averageDaysInStock),
      totalProfit: Math.round(totalProfit),
      activeDeals: activeDeals.length,
      dealsByStatus,
      dealsByRecommendation,
      recentDeals,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
