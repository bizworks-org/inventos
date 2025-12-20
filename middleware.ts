import { NextRequest, NextResponse } from "next/server";

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
function tryWebCryptoNonce(): string | null {
  try {
    const webCrypto = (globalThis as any).crypto;
    if (!webCrypto || typeof webCrypto.getRandomValues !== "function")
      return null;

    const arr = new Uint8Array(16);
    webCrypto.getRandomValues(arr);

    // If Buffer is available (Node environments), use it for base64 encoding
    if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
      return Buffer.from(arr).toString("base64");
    }

    // Fallback to browser btoa()
    if (typeof btoa === "function") {
      let binary = "";
      for (const byte of arr) {
        binary += String.fromCodePoint(byte);
      }
      return btoa(binary);
    }

    // Last-resort: use randomUUID if available
    if (typeof webCrypto.randomUUID === "function") {
      return webCrypto.randomUUID();
    }
  } catch (e) {
    // Log the error and fall back to other sources (keeps non-sensitive error info)
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "generateNonce: crypto.getRandomValues failed, falling back",
        e
      );
    }
  }
  return null;
}

function generateNonce(): string {
  // Prefer Web Crypto API (supported in Edge runtime)
  const webNonce = tryWebCryptoNonce();
  if (webNonce) return webNonce;

  // If Web Crypto is not available (very unlikely in Edge), fall back to
  // a pseudo-random string. We intentionally avoid requiring Node's crypto
  // here because middleware runs in the Edge runtime where Node modules
  // (including 'node:crypto') are not available and will break the build.
  if (typeof Math.random === "function") {
    return Math.random().toString(36).slice(2, 18);
  }
  return "fallback-nonce";
}

/**
 * Build Content Security Policy header with dynamic nonce
 * Prevents XSS, data injection, and clickjacking attacks
 * @param nonce - Unique nonce for this request
 * @returns CSP header string
 */
function buildCSPHeader(nonce: string): string {
  // Build directives as arrays for safer concatenation and conditional values
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Scripts: self, trusted CDN, and inline scripts with matching nonce
    "script-src": ["'self'", "https://trustedcdn.com", `'nonce-${nonce}'`],
    // Styles: self, unsafe-inline (for styled-components/emotion), and Google Fonts
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ],
    // Images: self, trusted CDN, and data URIs
    "img-src": ["'self'", "https://trustedcdn.com", "data:", "https:"],
    // Objects: strictly disabled for security (prevents Flash, plugins)
    "object-src": ["'none'"],
    // Base href: restrict to same origin
    "base-uri": ["'self'"],
    // Frame ancestors: prevent clickjacking
    "frame-ancestors": ["'none'"],
    // Forms: can only submit to same origin
    "form-action": ["'self'"],
    // XHR/WebSocket/EventSource connections
    "connect-src": ["'self'", "https://trustedcdn.com"],
    // Web fonts
    "font-src": [
      "'self'",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ],
    // Audio/video
    "media-src": ["'self'"],
    // App manifest
    "manifest-src": ["'self'"],
    // Iframes
    "frame-src": ["'none'"],
    // Upgrade HTTP requests to HTTPS (no values)
    "upgrade-insecure-requests": [],
  };

  // In development, it's common to load scripts from the dev server.
  // Only append the localhost host-source without quotes and only when
  // explicitly allowed (NODE_ENV !== 'production' or env var).
  try {
    const allowLocal =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_LOCALHOST === "1";
    if (allowLocal) {
      // Add the app origin (unquoted host-source) to script-src and connect-src
      // We avoid adding quoted host tokens (like `'http://localhost:3000'`) which are invalid.
      const devHost = process.env.DEV_HOST || "http://localhost:3000";
      // Only add if not already present
      if (!directives["script-src"].includes(devHost)) {
        directives["script-src"].push(devHost);
      }
      if (!directives["connect-src"].includes(devHost)) {
        directives["connect-src"].push(devHost);
      }
    }
  } catch (e) {
    // Log a non-sensitive warning to aid debugging without leaking secrets
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        "buildCSPHeader: unable to detect dev host environment; skipping localhost allowances",
        // Avoid logging the full error in case it contains sensitive info
        { message: e instanceof Error ? e.message : String(e) }
      );
    }
  }

  return Object.entries(directives)
    .map(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) return key;
      return `${key} ${value.join(" ")}`;
    })
    .join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/public")
  );

  // Generate nonce for this request
  const nonce = generateNonce();

  // Helper to add all security headers to response
  const addSecurityHeaders = (response: NextResponse) => {
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
      !/^\/[\\/]/.test(pathname)
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
    "/audit/:path*",
    "/assets/:path*",
    "/licenses/:path*",
    "/vendors/:path*",
    "/events/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
