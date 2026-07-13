import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, logActivity } from '@/lib/auth';
import { ContactSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        company: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionInfo.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot create contacts.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = ContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        title: data.title || null,
        companyId: data.companyId || null,
        ownerId: sessionInfo.user.id,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logActivity(
      sessionInfo.user.id,
      'CONTACT',
      contact.id,
      'CREATE',
      { name: contact.name },
      ip,
      req.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
