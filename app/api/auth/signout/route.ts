import { NextResponse } from 'next/server';
import { readAuthToken, verifyToken } from '@/lib/auth/server';
import { query } from '@/lib/db';
import { createHash } from 'node:crypto';
import { secureId } from '@/lib/secure';

export async function POST() {
  // Best-effort revoke the current session
  try {
    const token = await readAuthToken();
    if (token) {
      const hash = createHash('sha256').update(token).digest();
      await query('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = :th AND revoked_at IS NULL', { th: hash });
      // Additionally clear any remaining active sessions for this user to remove single-session lock
      try {
        const payload = verifyToken(token);
        if (payload?.id) {
          await query('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = :uid AND revoked_at IS NULL', { uid: payload.id });
          // Log auth.logout event (best-effort)
          try {
                await query(
              `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
               VALUES (:id, CURRENT_TIMESTAMP, :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
              {
                id: `EVT-${Date.now()}-${secureId('', 4)}`,
                severity: 'info',
                entity_type: 'user',
                entity_id: payload.id,
                action: 'auth.logout',
                user: payload.email || 'unknown',
                details: 'User logout',
                metadata: JSON.stringify({ sessionUserId: payload.id }),
              }
            );
          } catch {}
        }
      } catch {}
    }
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
