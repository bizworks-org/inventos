import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/me',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/_next') || pathname.startsWith('/assets') || pathname.startsWith('/public'));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    // Safely construct redirect to the internal login route and
    // validate the `next` target so we don't introduce an open redirect.
    // Only allow relative paths (that start with a single '/').
    // Optionally, allow absolute hosts if listed in REDIRECT_ALLOWLIST env var.
    // Reject protocol-relative paths ("//evil.com") which browsers treat as external.
    const safeNext = !pathname || !pathname.startsWith('/') || pathname.startsWith('//') ? '/' : pathname;

    // Build an absolute login URL using the current request origin to avoid leaking to other hosts.
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', safeNext);

    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/assets/:path*',
    '/licenses/:path*',
    '/vendors/:path*',
    '/events/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
