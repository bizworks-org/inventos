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
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
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
