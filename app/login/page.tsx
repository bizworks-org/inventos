"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@inventos.io');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sign in failed');
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#f1f5f9' }}>
      <form onSubmit={submit} style={{ width: 380, maxWidth: '100%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', padding: 24, borderRadius: 16, boxShadow: '0 20px 45px rgba(15,23,42,0.08)' }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>Sign in to Inventos</h1>
        <p style={{ color: '#64748b', marginTop: 0, marginBottom: 16 }}>Use the demo credentials prefilled below.</p>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', marginBottom: 12 }} />
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', marginBottom: 16 }} />
        {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}
        <button disabled={loading} type="submit" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 700 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
