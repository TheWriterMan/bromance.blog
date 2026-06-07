import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page — it must be publicly accessible
  if (pathname === '/cms/login') {
    return NextResponse.next();
  }

  // Check auth cookie for all /cms routes
  const isLoggedIn = request.cookies.get('cms_logged_in')?.value === 'true';

  if (!isLoggedIn) {
    const loginUrl = new URL('/cms/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cms/:path*'],
};
