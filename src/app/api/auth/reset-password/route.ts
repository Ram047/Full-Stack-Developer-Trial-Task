import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ResetPasswordSchema } from '@/lib/validation';
import { hashPassword, logActivity } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // Rate limit password resets: max 5 requests per 15 min per IP
  const rateCheck = await rateLimit(`reset_pwd_${ip}`, 5, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429, 
        headers: { 'Retry-After': rateCheck.retryAfter.toString() } 
      }
    );
  }

  try {
    const body = await req.json();
    const result = ResetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = result.data;
    
    // Hash token to look up in DB (tokens are stored hashed)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashed = await hashPassword(password);

    // Update user, and invalidate the reset token immediately (single-use requirement)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed.toString(),
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      },
    });

    await logActivity(
      user.id,
      'USER',
      user.id,
      'PASSWORD_RESET',
      { email: user.email },
      ip,
      req.headers.get('user-agent') || undefined
    );

    // Invalidate all active sessions for this user on password reset (security best practice)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
