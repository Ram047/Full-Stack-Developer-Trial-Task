import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all non-deleted deals
    const deals = await prisma.deal.findMany({
      where: { deletedAt: null },
    });

    const activeDeals = deals.filter(d => ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'].includes(d.stage));
    const wonDeals = deals.filter(d => d.stage === 'WON');
    const lostDeals = deals.filter(d => d.stage === 'LOST');

    // Total active value
    const totalActiveValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

    // Weighted value (value * probability)
    const weightedActiveValue = activeDeals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);

    // Average deal size
    const avgDealSize = deals.length > 0 ? (deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0;

    // Win rate = WON / (WON + LOST)
    const totalClosed = wonDeals.length + lostDeals.length;
    const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

    // Active deals by stage counts and values
    const stages = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const stageSummary = stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return {
        stage,
        count: stageDeals.length,
        value,
      };
    });

    // Recent activity logs (limit to 5)
    // If Admin/Owner, get all; if Member/Viewer, filter to their logs or general logs
    const logs = await prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalActiveValue,
        weightedActiveValue,
        avgDealSize,
        winRate,
        activeDealsCount: activeDeals.length,
        totalDealsCount: deals.length,
      },
      stageSummary,
      recentActivities: logs.map(l => ({
        id: l.id,
        userName: l.user?.name || 'System',
        entityType: l.entityType,
        action: l.action,
        details: JSON.parse(l.details),
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch dashboard metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
