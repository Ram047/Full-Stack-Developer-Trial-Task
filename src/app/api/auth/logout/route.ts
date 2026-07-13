import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession, logActivity } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionInfo = await getSession();
    
    if (sessionInfo) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await logActivity(
        sessionInfo.user.id,
        'AUTH',
        sessionInfo.user.id,
        'LOGOUT',
        { email: sessionInfo.user.email },
        ip,
        req.headers.get('user-agent') || undefined
      );
    }
    
    await destroySession();

    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
