import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/me",
];

/**
 * Generate a cryptographically secure random nonce
 * Used to allow specific inline scripts while blocking others
 * @returns Base64-encoded nonce string (16 bytes)
 */
function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

/**
 * Build Content Security Policy header with dynamic nonce
 * Prevents XSS, data injection, and clickjacking attacks
 * @param nonce - Unique nonce for this request
 * @returns CSP header string
 */
function buildCSPHeader(nonce: string): string {
  const directives = {
    // Default policy for resources not explicitly specified
    "default-src": "'self'",

    // Scripts: only self, trusted CDN, and inline scripts with matching nonce
    // The nonce prevents inline script injection attacks
    "script-src": `'self' https://trustedcdn.com 'nonce-${nonce}'`,

    // Styles: self, unsafe-inline (for styled-components/emotion), and Google Fonts
    "style-src":
      "'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",

    // Images: self, trusted CDN, and data URIs
    "img-src": "'self' https://trustedcdn.com data: https:",

    // Objects: strictly disabled for security (prevents Flash, plugins)
    "object-src": "'none'",

    // Base href: restrict to same origin
    "base-uri": "'self'",

    // Frame ancestors: prevent clickjacking
    "frame-ancestors": "'none'",

    // Forms: can only submit to same origin
    "form-action": "'self'",

    // XHR/WebSocket/EventSource connections
    "connect-src": "'self' https://trustedcdn.com",

    // Web fonts
    "font-src": "'self' https://fonts.googleapis.com https://fonts.gstatic.com",

    // Audio/video
    "media-src": "'self'",

    // App manifest
    "manifest-src": "'self'",

    // Iframes
    "frame-src": "'none'",

    // Upgrade HTTP requests to HTTPS
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) return key;
      return `${key} ${value}`;
    })
    .join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) =>
      pathname === p ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/assets") ||
      pathname.startsWith("/public")
  );

  // Generate nonce for this request
  const nonce = generateNonce();

  // Helper to add all security headers to response
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", buildCSPHeader(nonce));
    response.headers.set("x-nonce", nonce);
    response.headers.set(
      "Report-To",
      JSON.stringify({
        group: "csp-endpoint",
        max_age: 10886400,
        endpoints: [{ url: "/api/csp-report" }],
        include_subdomains: true,
      })
    );
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
  };

  // Handle public paths
  if (isPublic) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Check authentication
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const safeNext =
      typeof pathname === "string" &&
      pathname.startsWith("/") &&
      !pathname.startsWith("//") &&
      !/^\/[\\\/]/.test(pathname)
        ? pathname
        : "/";

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", safeNext);

    const response = NextResponse.redirect(loginUrl);
    addSecurityHeaders(response);
    return response;
  }

  // Authenticated request - proceed and set security headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assets/:path*",
    "/licenses/:path*",
    "/vendors/:path*",
    "/events/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
