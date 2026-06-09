import { NextRequest, NextResponse } from 'next/server';

/**
 * Checks if the request has a valid CMS session cookie.
 * Returns null if authenticated, or a 401 response if not.
 *
 * Usage:
 *   const denied = requireAuth(req);
 *   if (denied) return denied;
 */
export function requireAuth(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get('cms_logged_in')?.value;
  if (cookie !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
