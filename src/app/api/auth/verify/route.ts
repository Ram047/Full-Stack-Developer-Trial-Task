import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VerifyEmailSchema } from '@/lib/validation';
import { getSession, logActivity, rotateUserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 411 });
  }

  try {
    const body = await req.json();
    const result = VerifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: sessionInfo.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email already verified.' });
    }

    if (
      !user.emailVerificationToken ||
      user.emailVerificationToken !== token ||
      !user.emailVerificationTokenExpires ||
      user.emailVerificationTokenExpires < new Date()
    ) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Verify user and rotate their session due to privilege change (unverified -> verified)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logActivity(
      user.id,
      'USER',
      user.id,
      'VERIFICATION',
      { email: user.email, verified: true },
      ip,
      req.headers.get('user-agent') || undefined
    );

    // Rotate session on privilege change
    await rotateUserSession(user.id);

    return NextResponse.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
