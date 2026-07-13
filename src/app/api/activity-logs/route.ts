import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, hasRequiredRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Enforce ADMIN or OWNER role for viewing system activity logs
  if (!hasRequiredRole(sessionInfo.user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10));
  const cursorId = searchParams.get('cursor') || undefined;

  try {
    const logs = await prisma.activityLog.findMany({
      take: pageSize + 1,
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (logs.length > pageSize) {
      const nextItem = logs.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return NextResponse.json({
      success: true,
      logs,
      nextCursor,
    });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
