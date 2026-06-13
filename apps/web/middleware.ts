import { NextRequest, NextResponse } from 'next/server';

// Middleware runs on Edge Runtime — no Node.js `crypto` module.
// Use Web Crypto API for HMAC validation.
const SESSION_SECRET = process.env.CMS_SESSION_SECRET || process.env.CMS_PASSWORD || 'fallback-change-me';
const SESSION_COOKIE = 'cms_session';

async function validateToken(token: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const [expiryStr, signature] = token.split('.');
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry)) return false;
  if (Math.floor(Date.now() / 1000) > expiry) return false;

  const payload = `cms:${expiry}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison via subtle.verify isn't available for hex,
  // but we can compare byte-by-byte after converting.
  if (signature.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /cms itself is the login page — let it through
  if (pathname === '/cms') {
    return NextResponse.next();
  }

  // All other /cms/* routes require a valid signed session
  const token = request.cookies.get(SESSION_COOKIE)?.value || '';

  if (!(await validateToken(token))) {
    const cmsUrl = new URL('/cms', request.url);
    return NextResponse.redirect(cmsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cms/:path*'],
};
