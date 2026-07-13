import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionInfo = await getSession();
    
    if (!sessionInfo) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionInfo.user,
    });
  } catch (error) {
    console.error('Session status API error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
