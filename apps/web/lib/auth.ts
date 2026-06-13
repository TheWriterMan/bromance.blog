import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.CMS_SESSION_SECRET || process.env.CMS_PASSWORD || 'fallback-change-me';
const SESSION_COOKIE = 'cms_session';
const SESSION_MAX_AGE = 86400; // 24 hours

/**
 * Creates an HMAC-signed session token.
 * Format: <expiry_timestamp>.<hmac_signature>
 */
export function createSessionToken(): string {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `cms:${expiry}`;
  const hmac = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${expiry}.${hmac}`;
}

/**
 * Validates an HMAC-signed session token.
 * Returns true if the token is valid and not expired.
 */
export function validateSessionToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;

  const [expiryStr, signature] = token.split('.');
  const expiry = parseInt(expiryStr, 10);

  if (isNaN(expiry)) return false;

  // Check expiry
  if (Math.floor(Date.now() / 1000) > expiry) return false;

  // Verify HMAC
  const payload = `cms:${expiry}`;
  const expectedSignature = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Returns the Set-Cookie header value for a new session.
 */
export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict;${secure} Max-Age=${SESSION_MAX_AGE}`;
}

/**
 * Returns the Set-Cookie header value to clear the session.
 */
export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/**
 * Checks if the request has a valid CMS session.
 * Returns null if authenticated, or a 401 response if not.
 *
 * Usage:
 *   const denied = requireAuth(req);
 *   if (denied) return denied;
 */
export function requireAuth(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Checks if the request is authenticated (boolean version for middleware).
 */
export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return validateSessionToken(token);
}
