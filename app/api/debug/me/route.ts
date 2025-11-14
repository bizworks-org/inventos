import { NextResponse } from 'next/server';
import { readAuthToken, verifyToken } from '@/lib/auth/server';
import { dbGetUserPermissions } from '@/lib/auth/db-users';

export async function GET() {
  try {
    const token = await readAuthToken();
    const verified = token ? verifyToken(token as any) : null;
    const perms = verified?.id ? await dbGetUserPermissions((verified as any).id) : [];
    return NextResponse.json({ ok: true, tokenPresent: !!token, tokenDecoded: verified ?? null, perms });
  } catch (err: any) {
    console.error('Debug /api/debug/me error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
