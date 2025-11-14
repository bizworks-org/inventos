import { NextRequest, NextResponse } from 'next/server';
import { dbFindUserById, dbFindUserByEmail, dbUpdateUserPassword } from '@/lib/auth/db-users';
import { readAuthToken, verifyToken, hashPassword, verifyPassword } from '@/lib/auth/server';

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  let pwd = '';
  // Ensure at least one lowercase, one uppercase, one number; underscore optional
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  pwd += pick('abcdefghijklmnopqrstuvwxyz');
  pwd += pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  pwd += pick('0123456789');
  while (pwd.length < length) {
    pwd += pick(chars);
  }
  // shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const user = await dbFindUserById(userId);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Guard: do not allow resetting password of another administrator
  if ((user.roles || []).includes('admin') && (me as any).id !== userId) {
    return NextResponse.json({ error: 'Cannot reset password for another administrator.' }, { status: 403 });
  }
  const password = generatePassword(12);
  const password_hash = hashPassword(password);
  await dbUpdateUserPassword(userId, password_hash);

  // Verify the stored hash actually matches the generated password (sanity check)
  try {
    const reloaded = await dbFindUserByEmail(user.email);
    if (!reloaded || !reloaded.password_hash || !verifyPassword(password, reloaded.password_hash)) {
      console.error('Password reset verification failed for user', user.email);
      return NextResponse.json({ error: 'Failed to verify password reset. Try again.' }, { status: 500 });
    }
    // Log success (non-sensitive): indicate reset completed for this user
    try { if (process.env.NODE_ENV !== 'production') console.info('Password reset completed for', user.email, { userId: userId }); } catch(e) {}
  } catch (e) {
    console.error('Error verifying reset password for', user.email, e);
    return NextResponse.json({ error: 'Failed to verify password reset. Try again.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, password });
}
