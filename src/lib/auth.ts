import { cookies } from 'next/headers';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'pipeline_iq_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
}

export async function hashPassword(password: string): Promise<String> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a new session in the database and sets it in httpOnly cookies.
 * Automatically handles session rotation if a previous session exists.
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
  oldSessionId?: string
): Promise<String> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // If there was an old session, delete/invalidate it and log the rotation link
  if (oldSessionId) {
    try {
      await prisma.session.delete({
        where: { id: oldSessionId },
      });
    } catch {
      // Ignore if session already deleted
    }
  }

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      userAgent,
      ipAddress,
      rotatedFromSessionId: oldSessionId || null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session.id;
}

/**
 * Authenticates current session from cookie.
 * Automatically rotates session ID to prevent session fixation.
 */
export async function getSession(): Promise<{ user: SessionUser; sessionId: string } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!session) {
    // Session not found, clear stale cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const now = new Date();
  if (session.expiresAt < now) {
    // Session expired, delete from database and cookies
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  // Extend session if it is halfway through its lifespan (refresh token concept)
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  if (timeRemaining < SESSION_DURATION_MS / 2) {
    const newExpiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiresAt },
    });
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newExpiresAt,
      path: '/',
    });
  }

  return {
    user: session.user as SessionUser,
    sessionId: session.id,
  };
}

/**
 * Destroys current session and deletes cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Rotates a user's active session. Call this after a privilege change.
 */
export async function rotateUserSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (session) {
      await createSession(userId, session.userAgent || undefined, session.ipAddress || undefined, sessionId);
    }
  }
}

/**
 * Enforces Role-Based Access Control.
 * Returns true if the user meets or exceeds the required role.
 */
export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Log activities in the database.
 */
export async function logActivity(
  userId: string | null,
  entityType: 'USER' | 'AUTH' | 'DEAL' | 'CONTACT' | 'COMPANY',
  entityId: string | null,
  action: string,
  details: object,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId,
      entityType,
      entityId,
      action,
      details: JSON.stringify(details),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  }).catch((err) => console.error('Failed to log activity:', err));
}
