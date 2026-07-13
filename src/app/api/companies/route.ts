import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, logActivity } from '@/lib/auth';
import { CompanySchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error('Fetch companies error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionInfo.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot create companies.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = CompanySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const company = await prisma.company.create({
      data: {
        name: data.name,
        domain: data.domain || null,
        industry: data.industry || null,
        size: data.size || null,
        ownerId: sessionInfo.user.id,
      },
    });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logActivity(
      sessionInfo.user.id,
      'COMPANY',
      company.id,
      'CREATE',
      { name: company.name },
      ip,
      req.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
