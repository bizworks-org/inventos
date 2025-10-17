import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/server';

// DEV-ONLY: Generates a scrypt hash for a plaintext password.
// Guarded by NODE_ENV !== 'production' or env AUTH_HASH_DEV=1.
export async function POST(req: NextRequest) {
  const enabled = process.env.NODE_ENV !== 'production' || process.env.AUTH_HASH_DEV === '1';
  if (!enabled) return NextResponse.json({ error: 'Disabled' }, { status: 403 });

  const { password } = await req.json().catch(() => ({}));
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'password required' }, { status: 400 });
  }
  const hash = hashPassword(password);
  return NextResponse.json({ hash });
}
