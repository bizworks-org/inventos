export type ClientMe = {
  id: string;
  email: string;
  role: "admin" | "user" | "superadmin";
  roles?: string[];
  permissions?: string[];
  name?: string;
} | null;

export async function getMe(): Promise<ClientMe> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  const data = await res.json();
  return data.user as ClientMe;
}

export async function signOut() {
  await fetch("/api/auth/signout", { method: "POST" });
  if (globalThis.window !== undefined) globalThis.window.location.href = "/login";
}
