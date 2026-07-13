import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DealsClient } from './DealsClient';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/ui/Toast';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    view?: string;
    q?: string;
    stage?: string;
    minVal?: string;
    maxVal?: string;
    sortBy?: string;
    sortOrder?: string;
    cursor?: string;
    pageSize?: string;
  }>;
}

export default async function DealsPage({ searchParams }: PageProps) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    redirect('/auth/login');
  }

  const { user } = sessionInfo;

  // Resolve search parameters safely
  const resolvedParams = await searchParams;
  const view = resolvedParams.view || 'kanban';
  const q = resolvedParams.q || '';
  const stage = resolvedParams.stage || '';
  const minVal = resolvedParams.minVal ? parseFloat(resolvedParams.minVal) : undefined;
  const maxVal = resolvedParams.maxVal ? parseFloat(resolvedParams.maxVal) : undefined;
  const sortBy = resolvedParams.sortBy || 'createdAt';
  const sortOrder = resolvedParams.sortOrder === 'asc' ? 'asc' : 'desc';
  const cursorId = resolvedParams.cursor || undefined;
  const pageSize = Math.min(100, parseInt(resolvedParams.pageSize || '25', 10));

  // Build prisma query conditions
  const whereCondition: any = {
    deletedAt: null, // Soft delete checks
  };

  if (q) {
    whereCondition.OR = [
      { title: { contains: q } },
      { company: { name: { contains: q } } },
      { contact: { name: { contains: q } } },
    ];
  }

  if (stage) {
    whereCondition.stage = stage;
  }

  if (minVal !== undefined || maxVal !== undefined) {
    whereCondition.value = {};
    if (minVal !== undefined) whereCondition.value.gte = minVal;
    if (maxVal !== undefined) whereCondition.value.lte = maxVal;
  }

  // Sorting
  const orderBy: any[] = [];
  if (sortBy === 'value') {
    orderBy.push({ value: sortOrder });
  } else if (sortBy === 'expectedCloseDate') {
    orderBy.push({ expectedCloseDate: sortOrder });
  } else {
    orderBy.push({ createdAt: sortOrder });
  }
  orderBy.push({ id: 'asc' }); // Secondary stable sort

  // Query data on server (deals, companies, contacts)
  const deals = await prisma.deal.findMany({
    where: whereCondition,
    take: pageSize + 1,
    cursor: cursorId ? { id: cursorId } : undefined,
    skip: cursorId ? 1 : 0,
    orderBy,
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  let nextCursor: string | null = null;
  const dealsToRender = [...deals];
  if (dealsToRender.length > pageSize) {
    const nextItem = dealsToRender.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const contacts = await prisma.contact.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  // Calculate high-level filters/stats
  const totalCount = await prisma.deal.count({
    where: { deletedAt: null },
  });

  return (
    <ToastProvider>
      <div className="bg-[#030712] min-h-screen text-slate-100 flex flex-col font-sans">
        <Header user={user} />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DealsClient
            initialDeals={dealsToRender}
            nextCursor={nextCursor}
            companies={companies}
            contacts={contacts}
            userRole={user.role}
            currentFilters={{
              view,
              q,
              stage,
              minVal: resolvedParams.minVal || '',
              maxVal: resolvedParams.maxVal || '',
              sortBy,
              sortOrder,
              pageSize,
            }}
          />
        </main>
      </div>
    </ToastProvider>
  );
}
