import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  sessionCookieHeader,
  clearSessionCookieHeader,
  isAuthenticated,
} from '@/lib/auth';

const VALID_USERNAME = process.env.CMS_USERNAME || '';
const VALID_PASSWORD = process.env.CMS_PASSWORD || '';

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// Simple in-memory rate limiter. Resets on deploy/restart which is fine for a
// single-instance hobby app — it prevents brute-force during a session.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (isAuthenticated(req)) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'usr-1',
        name: 'Amy97',
        role: 'Administrator',
      },
    });
  }

  return NextResponse.json({ authenticated: false, user: null });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      recordAttempt(ip);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Success — clear rate limit and issue signed token
    clearAttempts(ip);
    const token = createSessionToken();

    const response = NextResponse.json({
      success: true,
      user: {
        id: 'usr-1',
        name: 'Amy97',
        role: 'Administrator',
      },
    });
    response.headers.set('Set-Cookie', sessionCookieHeader(token));
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', clearSessionCookieHeader());
  return response;
}
