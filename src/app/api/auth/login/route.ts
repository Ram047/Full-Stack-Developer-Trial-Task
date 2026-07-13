import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LoginSchema } from '@/lib/validation';
import { verifyPassword, createSession, logActivity } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate limit by IP: max 5 login requests per 15 min
  const ipRate = await rateLimit(`login_ip_${ip}`, 5, 15 * 60 * 1000);
  if (!ipRate.success) {
    return NextResponse.json(
      { error: 'Too many login attempts from this IP. Please try again later.' },
      { 
        status: 429, 
        headers: { 'Retry-After': ipRate.retryAfter.toString() } 
      }
    );
  }

  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const lowerEmail = email.toLowerCase();

    // Rate limit by account: max 5 login attempts per account per 15 min
    const accountRate = await rateLimit(`login_acct_${lowerEmail}`, 5, 15 * 60 * 1000);
    if (!accountRate.success) {
      return NextResponse.json(
        { error: 'Too many login attempts for this account. Please wait before retrying.' },
        { 
          status: 429, 
          headers: { 'Retry-After': accountRate.retryAfter.toString() } 
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    
    // Create new session (which sets cookie and rotates session if old one exists)
    await createSession(user.id, userAgent, ip);

    await logActivity(
      user.id,
      'AUTH',
      user.id,
      'LOGIN',
      { email: lowerEmail },
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
