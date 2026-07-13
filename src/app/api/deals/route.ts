import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, logActivity } from '@/lib/auth';
import { DealSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Handles Deal CRUD and List Views with filters, search, sort, and pagination.
 */
export async function GET(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || '';
  const stage = searchParams.get('stage') || '';
  const minVal = parseFloat(searchParams.get('minVal') || '') || undefined;
  const maxVal = parseFloat(searchParams.get('maxVal') || '') || undefined;
  const sortBy = searchParams.get('sortBy') || 'createdAt'; // value, expectedCloseDate, createdAt
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  
  // Keyset / cursor pagination
  const cursorId = searchParams.get('cursor') || undefined;
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10)); // Hard-capped at 100

  try {
    // Build query conditions
    const whereCondition: any = {
      deletedAt: null, // Soft delete filter
    };

    if (search) {
      whereCondition.OR = [
        { title: { contains: search } },
        { company: { name: { contains: search } } },
        { contact: { name: { contains: search } } },
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

    // Determine sorting
    const orderBy: any[] = [];
    if (sortBy === 'value') {
      orderBy.push({ value: sortOrder });
    } else if (sortBy === 'expectedCloseDate') {
      orderBy.push({ expectedCloseDate: sortOrder });
    } else {
      orderBy.push({ createdAt: sortOrder });
    }
    // Secondary stable sort on id to prevent page jitter
    orderBy.push({ id: 'asc' });

    // Query data
    const deals = await prisma.deal.findMany({
      where: whereCondition,
      take: pageSize + 1, // Fetch 1 extra to check if there is a next page
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0, // Skip the cursor itself
      orderBy,
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true, email: true },
        },
        owner: {
          select: { id: true, name: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (deals.length > pageSize) {
      const nextItem = deals.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return NextResponse.json({
      success: true,
      deals,
      nextCursor,
    });
  } catch (error) {
    console.error('Fetch deals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Creates a new Deal. Requires admin/member/owner role.
 */
export async function POST(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Enforce RBAC: VIEWER cannot mutate
  if (sessionInfo.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot create deals.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = DealSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        value: data.value,
        stage: data.stage,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        companyId: data.companyId || null,
        contactId: data.contactId || null,
        ownerId: sessionInfo.user.id,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logActivity(
      sessionInfo.user.id,
      'DEAL',
      deal.id,
      'CREATE',
      { title: deal.title, value: deal.value, stage: deal.stage },
      ip,
      req.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handles bulk updates (e.g. stage moves) and bulk deletes.
 */
export async function PUT(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionInfo.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot modify deals.' }, { status: 403 });
  }

  try {
    const { ids, stage, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Deal IDs are required.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;

    if (action === 'DELETE') {
      // Bulk soft delete
      await prisma.deal.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });

      await logActivity(
        sessionInfo.user.id,
        'DEAL',
        null,
        'DELETE',
        { count: ids.length, ids },
        ip,
        userAgent
      );

      return NextResponse.json({ success: true, message: `${ids.length} deals soft-deleted.` });
    } else if (stage) {
      // Bulk update stage
      await prisma.deal.updateMany({
        where: { id: { in: ids } },
        data: { stage },
      });

      await logActivity(
        sessionInfo.user.id,
        'DEAL',
        null,
        'UPDATE',
        { count: ids.length, ids, field: 'stage', newValue: stage },
        ip,
        userAgent
      );

      return NextResponse.json({ success: true, message: `${ids.length} deals updated to ${stage}.` });
    } else {
      return NextResponse.json({ error: 'Invalid action or stage parameter.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
