"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@inventos.io');
  const [password, setPassword] = useState('Cl635EbUp8dN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <main className={styles.wrapper}>
      <form onSubmit={submit} className={styles.card} aria-labelledby="loginTitle">
        <h1 id="loginTitle" className={styles.title}>Sign in to Inventos</h1>
        <p className={styles.subtitle}>Use your credentials to continue.</p>

        <div className={styles.fieldRow}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
            className={styles.input}
            autoComplete="username"
          />
        </div>

        <div className={styles.fieldRow}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <div className={styles.passwordRow}>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={styles.input}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.toggleBtn}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button disabled={loading} type="submit" className={styles.button}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
