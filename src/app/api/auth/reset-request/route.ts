import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ResetRequestSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // Rate limit password reset requests: max 5 requests per 15 min per IP
  const rateCheck = await rateLimit(`reset_req_${ip}`, 5, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: 'Too many password reset requests. Please try again later.' },
      { 
        status: 429, 
        headers: { 'Retry-After': rateCheck.retryAfter.toString() } 
      }
    );
  }

  try {
    const body = await req.json();
    const result = ResetRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const lowerEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    // To prevent timing attacks, we return success even if user doesn't exist
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a reset token has been generated and logged.',
      });
    }

    // Generate a secure, single-use reset token and hash it at rest
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes (15-30 min TTL req)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: tokenExpires,
      },
    });

    // CRITICAL: Log raw token to console for easy access in testing!
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATOR] Password Reset Email to: ${lowerEmail}`);
    console.log(`Reset Token (Raw): ${rawToken}`);
    console.log(`Reset Link: http://localhost:3000/auth/reset-password?token=${rawToken}`);
    console.log(`Expires at: ${tokenExpires.toISOString()}`);
    console.log(`======================================================\n`);

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been logged to console logs.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
