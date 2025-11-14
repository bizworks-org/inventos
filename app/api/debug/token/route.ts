import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth/server';

// WARNING: Temporary dev-only endpoint that returns a signed JWT for the local Admin user.
// Do NOT ship to production. Remove after debugging.
export async function GET() {
  try {
    // These values were observed from your debug output; adjust if different in your environment.
    const payload = { id: '340e45ce-ab04-11f0-94d6-56b27b532be0', email: 'admin@inventos.io', role: 'admin' };
    const token = signToken(payload as any, 60 * 60); // 1 hour
    return NextResponse.json({ ok: true, token });
  } catch (err: any) {
    console.error('Debug /api/debug/token error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
