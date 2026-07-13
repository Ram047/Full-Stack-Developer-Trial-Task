import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RegisterSchema } from '@/lib/validation';
import { hashPassword, logActivity } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate limit registration requests: max 5 registrations per 15 min per IP
  const rateCheck = await rateLimit(`register_ip_${ip}`, 5, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { 
        status: 429, 
        headers: { 'Retry-After': rateCheck.retryAfter.toString() } 
      }
    );
  }

  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;
    const lowerEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Determine role: if first user, make OWNER, else MEMBER
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'OWNER' : 'MEMBER';

    // Hash password
    const hashed = await hashPassword(password);

    // Generate 6-digit email verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email: lowerEmail,
        passwordHash: hashed.toString(),
        name,
        role,
        emailVerified: false,
        emailVerificationToken: verificationCode,
        emailVerificationTokenExpires: verificationExpires,
      },
    });

    // CRITICAL: Log verification token to console for easy access in testing!
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATOR] Verification Email to: ${lowerEmail}`);
    console.log(`Verification Code: ${verificationCode}`);
    console.log(`Expires at: ${verificationExpires.toISOString()}`);
    console.log(`======================================================\n`);

    await logActivity(
      user.id,
      'USER',
      user.id,
      'CREATE',
      { email: lowerEmail, role },
      ip,
      req.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Verification code has been sent to console logs.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
