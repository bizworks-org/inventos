"use client";
// Refactored for readability: consolidated helpers & extracted rendering functions.
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner@2.0.3";
import { useRouter } from "next/navigation";
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
  const [allRoles, setAllRoles] = useState<Role[]>([]);
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
    if (!res.ok) setError(data?.error || "Failed to load users");
    else {
      const meId = currentMeId ?? me?.id;
      const list = (data.users || []).map((u: any) => ({
        ...u,
        roles: u.roles || [],
      }));
      if (meId) {
        // Move current user to the top of the list while preserving order for others
        list.sort((a: any, b: any) =>
          a.id === meId ? -1 : b.id === meId ? 1 : 0
        );
      }
      setUsers(list);
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

  const generatePassword = () => {
    const finalPwd = makePassword();
    setForm((f) => ({ ...f, password: finalPwd }));
    (async () => {
      try {
        await navigator.clipboard.writeText(finalPwd);
        toast.success("Password generated (copied)");
      } catch {
        toast.success("Password generated");
      }
    })();
  };

  const makePassword = () => {
    const length = 12;
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const extra = "_";
    const all = lowers + uppers + digits + extra;
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
    let pwd = pick(lowers) + pick(uppers) + pick(digits);
    while (pwd.length < length) pwd += pick(all);
    const arr = pwd.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
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
      return toast.error(msg);
    }
    load();
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
      return toast.error(msg);
    }
    toast.success("User activated");
    load();
  };
  const resetPassword = async (id: string) => {
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Failed to reset password");
      const pwd = d?.password as string;
      if (pwd) {
        try {
          await navigator.clipboard.writeText(pwd);
        } catch {}
        toast.success(`New password: ${pwd} (copied)`);
      } else toast.success("Password reset");
    } catch (e: any) {
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

  return (
    <>
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
            disabled={!!editing}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin" disabled={me?.role !== "superadmin"}>
              Superadmin
            </option>
          </select>
          {/* Password is generated automatically on Create; generate button removed */}
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
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-[#ef4444]">{error}</p>
        ) : (
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
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-[#f1f5f9] ${
                      me?.id === u.id
                        ? "bg-indigo-50 border-l-4 border-indigo-800"
                        : ""
                    }`}
                  >
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
                      {/* Only Superadmin can see and interact with RoleChips. Other viewers see a non-interactive role label. */}
                      {me?.role === "superadmin" ? (
                        <RoleChips
                          user={u}
                          allRoles={allRoles as Role[]}
                          meId={me?.id}
                          meLoading={meLoading}
                          activeAdminCount={activeAdminCount}
                          onApplyRole={applyRole}
                          onConfirmRemoveAdmin={(userId, userName, nextRole) =>
                            setConfirmRemoveAdminFor({
                              userId,
                              userName,
                              nextRole,
                            })
                          }
                          meRole={me?.role}
                        />
                      ) : (
                        (() => {
                          const rolesArr = (u.roles || []) as Role[];
                          const display = rolesArr.includes("superadmin")
                            ? "Superadmin"
                            : rolesArr.includes("admin")
                            ? "Admin"
                            : "User";
                          return (
                            <div className="flex gap-3 flex-wrap py-0.5">
                              <span
                                className="px-3 py-2 rounded-lg border bg-white text-[#1a1d2e] border-[#e2e8f0] inline-flex items-center gap-2"
                                aria-hidden
                              >
                                {display}
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td className="py-3 pr-4 align-middle">
                      {u.active ? "Yes" : "No"}
                    </td>
                    <td className="py-3 pr-4 align-middle">
                      <UserActions
                        user={u}
                        meId={me?.id}
                        meRole={me?.role}
                        activeAdminCount={activeAdminCount}
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
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                . This may restrict access to administrative features.
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
