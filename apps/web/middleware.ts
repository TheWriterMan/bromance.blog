import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /cms itself handles its own auth state (shows login form or redirects)
  if (pathname === '/cms') {
    return NextResponse.next();
  }

  // All other /cms/* routes require authentication
  const isLoggedIn = request.cookies.get('cms_logged_in')?.value === 'true';

  if (!isLoggedIn) {
    const cmsUrl = new URL('/cms', request.url);
    return NextResponse.redirect(cmsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cms/:path*'],
};
