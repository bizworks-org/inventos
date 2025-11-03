import { NextResponse } from 'next/server';
import { readAuthToken } from '@/lib/auth/server';
import { query } from '@/lib/db';
import { createHash } from 'node:crypto';

export async function POST() {
  // Best-effort revoke the current session
  try {
    const token = await readAuthToken();
    if (token) {
      const hash = createHash('sha256').update(token).digest();
      await query('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = :th AND revoked_at IS NULL', { th: hash });
    }
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
