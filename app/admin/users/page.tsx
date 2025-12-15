"use client";
// Refactored for readability: consolidated helpers & extracted rendering functions.
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { RoleChips } from "./components/RoleChips";
import { UserActions } from "./components/UserActions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
// Tooltip imports removed; tooltips now live only inside child components.

import type { Role, User } from "./types";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    role: Role;
    password: string;
  }>({
    name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [me, setMe] = useState<{
    id: string;
    email: string;
    role: Role;
  } | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [confirmRemoveAdminFor, setConfirmRemoveAdminFor] = useState<{
    userId: string;
    userName: string;
    nextRole?: Role;
  } | null>(null);
  // Temporary visible passwords shown after a reset, kept in-memory for 60s
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, string>
  >({});
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  // Track rows that are temporarily disabled (optimistic UI during activate/deactivate)
  const [rowDisabled, setRowDisabled] = useState<Record<string, boolean>>({});
  // Track per-row pending actions: 'activating' | 'deactivating'
  const [rowPendingAction, setRowPendingAction] = useState<
    Record<string, "activating" | "deactivating">
  >({});
  const router = useRouter();

  // NOTE: Gradients for permissions no longer used here after extraction.

  const load = async (currentMeId?: string) => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users");
    if (res.status === 403) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    if (res.ok) {
      const meId = currentMeId ?? me?.id;
      const list = (data.users || []).map((u: any) => ({
        ...u,
        roles: u.roles || [],
      }));
      if (meId) {
        // Move current user to the top of the list while preserving order for others
        list.sort((a: any, b: any) => {
          // Extract the nested ternary into an independent statement for clarity
          let result = 0;
          if (a.id === meId) {
            result = -1;
          } else if (b.id === meId) {
            result = 1;
          }
          return result;
        });
      }
      setUsers(list);
    } else {
      setError(data?.error || "Failed to load users");
    }
    setLoading(false);
  };
  useEffect(() => {
    (async () => {
      let fetchedMeId: string | undefined = undefined;
      try {
        setMeLoading(true);
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const d = await r.json();
        setMe(d?.user || null);
        fetchedMeId = d?.user?.id;
      } catch {
        setMe(null);
      } finally {
        setMeLoading(false);
      }

      // Load users after `me` so self-detection works immediately.
      await load(fetchedMeId);

      // Fetch available roles.
      try {
        const r2 = await fetch("/api/admin/rbac/roles");
        const d2 = await r2.json();
        setAllRoles(d2.roles || []);
      } catch {
        setAllRoles([]);
      }
    })();
  }, []);

  const canEditRoleForTarget = (target?: User | null) => {
    if (!me) return false;
    if (me.role === "superadmin") return true;
    if (me.role !== "admin") return false;
    // viewer is admin
    if (!target) return true; // creating a new user
    const targetRoles = target.roles || [];
    if (targetRoles.includes("superadmin")) return false;
    const targetIsAdmin = targetRoles.includes("admin");
    const isSelf = target.id === me.id;
    if (targetIsAdmin && !isSelf) return false; // cannot edit other admins
    return true;
  };

  const adminCount = useMemo(
    () => users.filter((u) => (u.roles || []).includes("admin")).length,
    [users]
  );
  const superCount = useMemo(
    () => users.filter((u) => (u.roles || []).includes("superadmin")).length,
    [users]
  );

  const allowedRolesForTarget = (target?: User | null) => {
    const base = allRoles?.length
      ? [...allRoles]
      : ["user", "admin", "superadmin", "auditor"]; // Default roles include auditor
    let list = base.slice();
    if (me?.role !== "superadmin")
      list = list.filter((r) => r !== "superadmin");

    // If admin limit reached, do not show Admin for targets that don't already have it
    if (adminCount >= 5) {
      const targetHasAdmin = !!(
        target && (target.roles || []).includes("admin")
      );
      if (!targetHasAdmin) list = list.filter((r) => r !== "admin"); // Filter admin role
    }

    // If superadmin limit reached, do not show Superadmin for targets that don't already have it
    if (superCount >= 3) {
      const targetHasSuper = !!(
        target && (target.roles || []).includes("superadmin")
      );
      if (!targetHasSuper) list = list.filter((r) => r !== "superadmin"); // Filter superadmin role
    }

    // Auditor role may be assigned by Admin and Superadmin from the UI.
    // Only regular users (non-admins) should not see the auditor option.
    if (!(me?.role === "admin" || me?.role === "superadmin")) {
      list = list.filter((r) => r !== "auditor");
    }

    // Deduplicate any accidental duplicates from the server
    list = Array.from(new Set(list));

    return list as Role[];
  };

  const makePassword = () => {
    const length = 12;
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const extra = "_";
    const all = lowers + uppers + digits + extra;

    // Use Web Crypto API for cryptographically secure randomness when available.
    const getRandomInt = (max: number) => {
      try {
        if (
          typeof globalThis !== "undefined" &&
          globalThis.crypto?.getRandomValues
        ) {
          const arr = new Uint32Array(1);
          globalThis.crypto.getRandomValues(arr);
          return arr[0] % max;
        }
      } catch {
        // fall through to Math.random fallback below
      }
      return Math.floor(Math.random() * max);
    };

    const pick = (set: string) => set[getRandomInt(set.length)];
    let pwd = pick(lowers) + pick(uppers) + pick(digits);
    while (pwd.length < length) pwd += pick(all);
    const arr = pwd.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  };

  const addUser = async () => {
    // Guard: only a Superadmin can create another Superadmin user from the UI.
    if (form.role === "superadmin" && me?.role !== "superadmin") {
      return toast.error(
        "Only a Superadmin may create another Superadmin user."
      );
    }

    // If no password provided, generate one now and copy it to clipboard.
    let passwordToSend = form.password;
    if (!passwordToSend) {
      passwordToSend = makePassword();
      try {
        await navigator.clipboard.writeText(passwordToSend);
        toast.success("Password generated and copied to clipboard");
      } catch {
        toast.success("Password generated");
      }
    }

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, password: passwordToSend }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data?.error || "Failed to create user");
    setForm({ name: "", email: "", role: "user", password: "" });
    load();
  };
  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        name: form.name,
        email: form.email,
      }),
    });
    if (!res.ok) {
      let msg = "Failed to update user";
      try {
        const d = await res.json();
        if (d?.error) msg = d.error;
      } catch {}
      toast.error(msg);
      return;
    }
    toast.success("User updated");
    setEditing(null);
    setForm({ name: "", email: "", role: "user", password: "" });
    load();
  };
  const roleUpdateTimers = useRef<Record<string, any>>({});
  const pendingUserRoles = useRef<Record<string, Role[]>>({});
  const queueUserRolesUpdate = (id: string, roles: Role[]) => {
    pendingUserRoles.current[id] = roles;
    if (roleUpdateTimers.current[id])
      clearTimeout(roleUpdateTimers.current[id]);
    roleUpdateTimers.current[id] = setTimeout(async () => {
      const latest = pendingUserRoles.current[id];
      try {
        const res = await fetch("/api/admin/rbac/user-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, roles: latest }),
        });
        if (!res.ok) throw new Error("Update failed");
      } catch {
        toast.error("Failed to update user roles");
      } finally {
        delete roleUpdateTimers.current[id];
      }
    }, 500);
  };
  const deactivate = async (id: string) => {
    // Optimistic UI: mark row disabled and set active=false locally
    setRowDisabled((s) => ({ ...s, [id]: true }));
    setRowPendingAction((s) => ({ ...s, [id]: "deactivating" }));
    setUsers((cur) =>
      cur.map((u) => (u.id === id ? { ...u, active: false } : u))
    );
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: false }),
      });
      if (!res.ok) {
        let msg = "Update failed";
        try {
          const d = await res.json();
          if (d?.error) msg = d.error;
        } catch {}
        throw new Error(msg);
      }
      // success: clear disabled and refresh
      setRowDisabled((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setRowPendingAction((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      load();
    } catch (err: any) {
      // rollback optimistic changes
      setRowDisabled((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setRowPendingAction((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setUsers((cur) =>
        cur.map((u) => (u.id === id ? { ...u, active: true } : u))
      );
      toast.error(err?.message || "Failed to update user");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) return toast.error("Delete failed");
    load();
  };
  const activate = async (id: string) => {
    // Optimistic UI: mark row disabled while activating
    setRowDisabled((s) => ({ ...s, [id]: true }));
    setRowPendingAction((s) => ({ ...s, [id]: "activating" }));
    setUsers((cur) =>
      cur.map((u) => (u.id === id ? { ...u, active: true } : u))
    );
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: true }),
      });
      if (!res.ok) {
        let msg = "Update failed";
        try {
          const d = await res.json();
          if (d?.error) msg = d.error;
        } catch {}
        throw new Error(msg);
      }
      setRowDisabled((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setRowPendingAction((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      toast.success("User activated");
      load();
    } catch (err: any) {
      // rollback optimistic
      setRowDisabled((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setRowPendingAction((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setUsers((cur) =>
        cur.map((u) => (u.id === id ? { ...u, active: false } : u))
      );
      toast.error(err?.message || "Failed to activate user");
    }
  };
  // fallback copy using execCommand for older browsers
  const fallbackCopyToClipboard = (text: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      // execCommand is deprecated in lib.dom.d.ts; cast to any to avoid the deprecated signature error
      (document as any).execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  };

  const tryCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyToClipboard(text);
    }
  };

  const clearVisiblePassword = (userId: string) => {
    try {
      setVisiblePasswords((cur) => {
        const copy = { ...cur };
        delete copy[userId];
        return copy;
      });
    } catch (err) {
      console.error("[users] resetPassword:clearVisiblePassword error", err);
    }
  };

  const showVisiblePasswordForAWhile = (userId: string, password: string) => {
    try {
      setVisiblePasswords((cur) => ({ ...cur, [userId]: password }));
      setTimeout(() => clearVisiblePassword(userId), 60_000);
    } catch (err) {
      console.error("[users] resetPassword:setVisiblePasswords error", err);
    }
  };

  const resetPassword = async (id: string) => {
    console.debug("[users] resetPassword:start", { id });

    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const d = await res.json();
      console.debug("[users] resetPassword:response", {
        status: res.status,
        ok: res.ok,
        data: d,
      });
      if (!res.ok) throw new Error(d?.error || "Failed to reset password");

      const pwd = d?.password as string;
      if (!pwd) {
        console.debug("[users] resetPassword:about-to-toast-generic");
        toast.success("Password reset");
        return;
      }

      const copied = await tryCopyToClipboard(pwd);
      console.debug("[users] resetPassword:about-to-toast", {
        pwdPreview: pwd?.slice?.(0, 4) ?? "",
        copied,
      });
      toast.success(`New password: ${pwd}${copied ? " (copied)" : ""}`);

      showVisiblePasswordForAWhile(id, pwd);

      if (!copied) {
        // Surface the password in a second toast for clarity if copy failed
        setTimeout(() => {
          console.debug("[users] resetPassword:about-to-toast-info", {
            pwdPreview: pwd?.slice?.(0, 6) ?? "",
          });
          toast.info(`Copy failed. Password: ${pwd}`);
        }, 50);
      }
    } catch (e: any) {
      console.debug("[users] resetPassword:error", e);
      toast.error(e?.message || "Failed to reset password");
    }
  };

  const activeAdminCount = useMemo(
    () =>
      users.filter((u) => u.active && (u.roles || []).includes("admin")).length,
    [users]
  );
  const applyRole = (userId: string, role: Role) => {
    const target = users.find((u) => u.id === userId);
    if (target && (target.roles || []).includes("superadmin")) {
      toast.error("Cannot modify roles for a Superadmin user.");
      return;
    }

    const nextArr: Role[] = [role];
    setUsers((cur) =>
      cur.map((u) => (u.id === userId ? { ...u, roles: nextArr } : u))
    );
    queueUserRolesUpdate(userId, nextArr);
  };

  const roleDisplay = (roles: Role[] = []) => {
    if (roles.includes("superadmin")) return "Superadmin";
    if (roles.includes("admin")) return "Admin";
    if (roles.includes("auditor")) return "Auditor";
    return "User";
  };

  const ROLE_LABELS: Record<Role, string> = {
    superadmin: "Superadmin",
    admin: "Admin",
    auditor: "Auditor",
    user: "User",
  };

  const renderUserRow = (u: User) => {
    let rowClass =
      me?.id === u.id ? "bg-indigo-50 border-l-4 border-indigo-800" : "";
    // If the user is deactivated, or a deactivate request is currently in-flight
    // highlight the row so the state change is visible optimistically.
    if (!u.active || rowPendingAction[u.id] === "deactivating") {
      rowClass = `${rowClass} bg-yellow-50 border-l-4 border-yellow-400`.trim();
    }

    return (
      <tr key={u.id} className={`border-b border-[#f1f5f9] ${rowClass}`}>
        <td className="py-3 pr-4 align-middle">
          <div className="flex items-center gap-2">
            <span>{u.name}</span>
            {me?.id === u.id && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                You
              </span>
            )}
          </div>
        </td>
        <td className="py-3 pr-4">{u.email}</td>
        <td className="py-3 pr-4 align-middle">
          {me?.role === "superadmin" || me?.role === "admin" ? (
            <RoleChips
              user={u}
              allRoles={allowedRolesForTarget(u)}
              meId={me?.id}
              meLoading={meLoading}
              activeAdminCount={activeAdminCount}
              onApplyRole={applyRole}
              onConfirmRemoveAdmin={(userId, userName, nextRole) =>
                setConfirmRemoveAdminFor({ userId, userName, nextRole })
              }
              meRole={me?.role}
            />
          ) : (
            <div className="flex gap-3 flex-wrap py-0.5">
              <span
                className="px-3 py-2 rounded-lg border bg-white text-[#1a1d2e] border-[#e2e8f0] inline-flex items-center gap-2"
                aria-hidden
              >
                {roleDisplay(u.roles || [])}
              </span>
            </div>
          )}
        </td>
        <td className="py-3 pr-4 align-middle">{u.active ? "Yes" : "No"}</td>
        <td className="py-3 pr-4 align-middle">
          <UserActions
            user={u}
            meId={me?.id}
            meRole={me?.role}
            activeAdminCount={activeAdminCount}
            visiblePassword={visiblePasswords[u.id]}
            onEdit={(user) => {
              setEditing(user);
              setForm({
                name: user.name,
                email: user.email,
                role: user.roles[0] || "user",
                password: "",
              });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onActivate={activate}
            onDeactivate={deactivate}
            onResetPassword={resetPassword}
            onRemove={remove}
            rowDisabled={!!rowDisabled[u.id]}
          />
        </td>
      </tr>
    );
  };

  return (
    <>
      {(loading || meLoading) && <FullPageLoader message="Loading users..." />}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6 max-w-3xl">
        <h2 className="text-lg font-semibold mb-3">
          {editing ? `Edit User: ${editing.name}` : "Add User"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
          <input
            className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
          />
          <select
            className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            disabled={
              editing
                ? !canEditRoleForTarget(editing)
                : !canEditRoleForTarget(null)
            }
          >
            {(editing ? allowedRolesForTarget(editing) : allowedRolesForTarget(null)).map(
              (r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? String(r)}
                </option>
              )
            )}
          </select>
        </div>
        <div className="mt-4 flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={!form.name || !form.email}
                className={`px-4 py-2.5 rounded-lg text-white hover:opacity-90 ${
                  !form.name || !form.email ? "cursor-not-allowed" : ""
                }`}
                style={
                  !form.name || !form.email
                    ? { backgroundColor: "#9ca3af" }
                    : {
                        backgroundImage:
                          "linear-gradient(to right, #6366f1, #8b5cf6)",
                      }
                }
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", email: "", role: "user", password: "" });
                }}
                className="px-4 py-2.5 rounded-lg bg-[#f3f4f6] text-[#111827]"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={addUser}
                disabled={!form.name || !form.email}
                className={`px-4 py-2.5 rounded-lg text-white hover:opacity-90 ${
                  !form.name || !form.email ? "cursor-not-allowed" : ""
                }`}
                style={
                  !form.name || !form.email
                    ? { backgroundColor: "#9ca3af" }
                    : {
                        backgroundImage:
                          "linear-gradient(to right, #1a1d2e, #0f1218)",
                      }
                }
              >
                Create
              </button>
              <p className="text-xs text-[#64748b]">
                Create will generate a secure password and copy it to your
                clipboard.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Users</h2>
        {(() => {
          if (loading) return <p>Loading…</p>;
          if (error) return <p className="text-[#ef4444]">{error}</p>;
          return renderUserTable(users, renderUserRow);
        })()}
      </div>
      <AlertDialog
        open={!!confirmRemoveAdminFor}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveAdminFor(null);
        }}
      >
        {confirmRemoveAdminFor && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Admin role?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to remove the Admin role from{" "}
                <span className="font-semibold">
                  {confirmRemoveAdminFor.userName}
                </span>
                {". "}This may restrict access to administrative features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const target = confirmRemoveAdminFor;
                  if (!target) return;
                  setConfirmRemoveAdminFor(null);
                  const desiredRole: Role = target.nextRole ?? "user";
                  const next: Role[] = [desiredRole];
                  setUsers((cur) =>
                    cur.map((usr) =>
                      usr.id === target.userId ? { ...usr, roles: next } : usr
                    )
                  );
                  queueUserRolesUpdate(target.userId, next);
                }}
                className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}
function renderUserTable(
  users: User[],
  renderUserRow: (u: User) => JSX.Element
): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-[#e2e8f0] text-[#64748b]">
            <th className="py-3 pr-4">Name</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Roles</th>
            <th className="py-3 pr-4">Active</th>
            <th className="py-3 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>{users.map((u) => renderUserRow(u))}</tbody>
      </table>
    </div>
  );
}
