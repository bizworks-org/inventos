"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { useMe } from "@/components/assetflow/layout/MeContext";
import { getMe } from "@/lib/auth/client";
import { toast } from "@/components/ui/sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@inventos.io");
  const [password, setPassword] = useState("xbI80gepkxn9");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setMe } = useMe();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Some error occurred in the server" };
      }
      if (!res.ok) throw new Error(data?.error || "Sign in failed");
      // Hydrate MeContext immediately so Sidebar can render admin links without a full refresh
      try {
        const me = await getMe();
        if (me) {
          setMe({
            id: me.id,
            email: me.email,
            role: me.role || "user",
            name: me.name,
          });
          // Update SSR hint attributes client-side (best-effort) to avoid any visual flicker
          try {
            const isAdminLike = me.role === "admin" || me.role === "superadmin";
            document.documentElement.setAttribute(
              "data-admin",
              isAdminLike ? "true" : "false"
            );
            document.documentElement.setAttribute(
              "data-ssr-me",
              encodeURIComponent(JSON.stringify(me))
            );
          } catch {}
        }
      } catch {}
      router.replace("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <form
        onSubmit={submit}
        className={styles.card}
        aria-labelledby="loginTitle"
      >
        <h1 id="loginTitle" className={styles.title}>
          Sign in to Inventos
        </h1>
        <p className={styles.subtitle}>Use your credentials to continue.</p>

        <div className={styles.fieldRow}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
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
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={styles.passwordRow}>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={styles.input}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.toggleBtn}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <button disabled={loading} type="submit" className={styles.button}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
