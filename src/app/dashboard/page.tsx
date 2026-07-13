import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/ui/Toast';
import { DashboardCharts } from '@/components/DashboardCharts';
import { CommandPalette } from '@/components/CommandPalette';
import { TrendingUp, DollarSign, Target, Briefcase, FileClock, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    redirect('/auth/login');
  }

  const { user } = sessionInfo;

  // 1. Fetch Dashboard aggregations directly on the server (SSR)
  const deals = await prisma.deal.findMany({
    where: { deletedAt: null },
  });

  const activeDeals = deals.filter((d) =>
    ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'].includes(d.stage)
  );
  const wonDeals = deals.filter((d) => d.stage === 'WON');
  const lostDeals = deals.filter((d) => d.stage === 'LOST');

  const totalActiveValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedActiveValue = activeDeals.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0
  );
  const avgDealSize = deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0;
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

  // Compile stages summary
  const stages = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  const stageSummary = stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  // Fetch recent activity logs (limit to 5)
  const recentActivities = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <ToastProvider>
      <div className="bg-[#030712] min-h-screen text-slate-100 flex flex-col font-sans">
        
        {/* Header navigation bar */}
        <Header user={user} />

        {/* Command Palette */}
        <CommandPalette />

        {/* Dashboard Main container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Header Title section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Sales Operations Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">Real-time pipeline metrics and weighted revenue forecasting.</p>
            </div>
            <div className="text-xs text-slate-450 bg-slate-900 border border-slate-850 px-3 py-2 rounded-lg font-mono">
              Role Permission Level: <span className="text-emerald-400 font-semibold">{user.role}</span>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Active Value */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
                <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-mono">{formatCurrency(totalActiveValue)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Total active deal volume</p>
              </div>
            </div>

            {/* Metric 2: Weighted Forecast Value */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Weighted Forecast</span>
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-mono">{formatCurrency(weightedActiveValue)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Adjusted by stage probabilities</p>
              </div>
            </div>

            {/* Metric 3: Win Rate */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Closed Win Rate</span>
                <Target className="h-4.5 w-4.5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-mono">{winRate.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-500 mt-1">Won vs Lost closed accounts</p>
              </div>
            </div>

            {/* Metric 4: Active Deals Count */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Deals</span>
                <Briefcase className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-mono">{activeDeals.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Currently open negotiations</p>
              </div>
            </div>
          </div>

          {/* SVG Forecasting Charts widget */}
          <DashboardCharts stageSummary={stageSummary} />

          {/* Audit trail activity log feed */}
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
              <div className="flex items-center gap-2">
                <FileClock className="h-4.5 w-4.5 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Recent Audit Activity</h3>
              </div>
              {user.role === 'ADMIN' || user.role === 'OWNER' ? (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wide">
                  Secure Server Log
                </span>
              ) : null}
            </div>

            <div className="divide-y divide-slate-850">
              {recentActivities.map((log) => {
                const details = JSON.parse(log.details);
                return (
                  <div key={log.id} className="py-3 flex justify-between items-center text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-200 font-medium font-mono">
                        {log.entityType}:{log.action}
                      </span>
                      <span className="text-slate-450 text-[11px]">
                        By {log.user?.name || 'System'} • {details.title || details.email || details.message || 'No description'}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
