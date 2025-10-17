export async function getMe() {
  const res = await fetch('/api/auth/me', { cache: 'no-store' });
  const data = await res.json();
  return data.user as { id: string; email: string; role: 'admin' | 'user'; name?: string } | null;
}

export async function signOut() {
  await fetch('/api/auth/signout', { method: 'POST' });
  if (typeof window !== 'undefined') window.location.href = '/login';
}
