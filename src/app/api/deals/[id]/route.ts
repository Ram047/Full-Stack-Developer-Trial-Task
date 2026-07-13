import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, logActivity } from '@/lib/auth';
import { DealSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        contact: true,
        owner: { select: { id: true, name: true } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Fetch deal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionInfo.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot modify deals.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const body = await req.json();
    
    // Partial schema validation for patches
    const result = DealSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.probability !== undefined) updateData.probability = data.probability;
    if (data.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = data.expectedCloseDate ? new Date(data.expectedCloseDate) : null;
    }
    if (data.companyId !== undefined) updateData.companyId = data.companyId || null;
    if (data.contactId !== undefined) updateData.contactId = data.contactId || null;

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: updateData,
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
      id,
      'UPDATE',
      { changes: updateData },
      ip,
      req.headers.get('user-agent') || undefined
    );

    // Return the updated deal directly so client reconciles immediately without second GET (req)
    return NextResponse.json({ success: true, deal: updatedDeal });
  } catch (error) {
    console.error('Update deal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionInfo.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot delete deals.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Soft delete deal
    const softDeleted = await prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logActivity(
      sessionInfo.user.id,
      'DEAL',
      id,
      'DELETE',
      { title: deal.title },
      ip,
      req.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true, message: 'Deal soft-deleted successfully.', deal: softDeleted });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
