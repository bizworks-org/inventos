"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User as UserIcon, Package, FileText, Building2, Activity } from 'lucide-react';

type Role = 'admin' | 'user';
type User = { id: string; name: string; email: string; roles: Role[]; active: boolean };

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: Role; password: string }>({ name: '', email: '', role: 'user', password: '' });
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<Role, Set<string>>>({ admin: new Set(), user: new Set() });
  const router = useRouter();

  // Helpers: choose stable, high-contrast gradient colors for chips
  const roleGradient = (r: Role) => {
    // Admin: pink/rose; User: emerald/teal
    return r === 'admin'
      ? 'linear-gradient(to right, #ec4899, #f43f5e)'
      : 'linear-gradient(to right, #10b981, #14b8a6)';
  };

  const permissionGradient = (p: string) => {
    // Default indigo; map resources to brand palettes
    if (p.includes('assets')) return 'linear-gradient(to right, #f59e0b, #f97316)';
    if (p.includes('licenses')) return 'linear-gradient(to right, #ec4899, #f43f5e)';
    if (p.includes('vendors')) return 'linear-gradient(to right, #06b6d4, #3b82f6)';
    if (p.includes('events')) return 'linear-gradient(to right, #22c55e, #14b8a6)';
    return 'linear-gradient(to right, #6366f1, #8b5cf6)';
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/users');
    if (res.status === 403) {
      router.replace('/login');
      return;
    }
    const data = await res.json();
    if (!res.ok) setError(data?.error || 'Failed to load users');
    else setUsers((data.users || []).map((u: any) => ({ ...u, roles: u.roles || [] })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // fetch roles and permissions in parallel
    Promise.all([
      fetch('/api/admin/rbac/roles').then(r => r.json()).catch(() => ({ roles: [] })),
      fetch('/api/admin/rbac/permissions').then(r => r.json()).catch(() => ({ permissions: [] })),
      fetch('/api/admin/rbac/role-permissions?role=admin').then(r => r.json()).catch(() => ({ role: 'admin', permissions: [] })),
      fetch('/api/admin/rbac/role-permissions?role=user').then(r => r.json()).catch(() => ({ role: 'user', permissions: [] })),
    ]).then(([r1, r2, rpA, rpU]) => {
      setAllRoles(r1.roles || []);
      setAllPermissions(r2.permissions || []);
      setRolePerms({
        admin: new Set(rpA.permissions || []),
        user: new Set(rpU.permissions || []),
      });
    });
  }, []);

  const addUser = async () => {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || 'Failed to create user');
    setForm({ name: '', email: '', role: 'user', password: '' });
    load();
  };

  // Queued updates for user roles (debounced per user)
  const roleUpdateTimers = useRef<Record<string, any>>({});
  const pendingUserRoles = useRef<Record<string, Role[]>>({});
  const queueUserRolesUpdate = (id: string, roles: Role[]) => {
    pendingUserRoles.current[id] = roles;
    if (roleUpdateTimers.current[id]) clearTimeout(roleUpdateTimers.current[id]);
    roleUpdateTimers.current[id] = setTimeout(async () => {
      const latest = pendingUserRoles.current[id];
      try {
        const res = await fetch('/api/admin/rbac/user-roles', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, roles: latest })
        });
        if (!res.ok) throw new Error('Update failed');
      } catch (e) {
        alert('Failed to update user roles');
        // Optionally reload to resync
        // load();
      } finally {
        delete roleUpdateTimers.current[id];
      }
    }, 500);
  };

  const deactivate = async (id: string) => {
    const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: false }) });
    if (!res.ok) return alert('Update failed');
    load();
  };

  // Queued updates for role permissions (debounced per role)
  const rolePermUpdateTimers = useRef<Record<Role, any>>({ admin: null, user: null });
  const pendingRolePerms = useRef<Record<Role, Set<string>>>({ admin: new Set(), user: new Set() });
  const queueRolePermsUpdate = (role: Role, nextSet: Set<string>) => {
    pendingRolePerms.current[role] = new Set(nextSet);
    const timer = rolePermUpdateTimers.current[role];
    if (timer) clearTimeout(timer);
    rolePermUpdateTimers.current[role] = setTimeout(async () => {
      const latest = Array.from(pendingRolePerms.current[role] || []);
      try {
        const res = await fetch('/api/admin/rbac/role-permissions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, permissions: latest })
        });
        if (!res.ok) throw new Error('Failed to update permissions');
      } catch {
        alert('Failed to update permissions');
      } finally {
        rolePermUpdateTimers.current[role] = null;
      }
    }, 500);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) return alert('Delete failed');
    load();
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1d2e]">Manage Users</h1>
        <p className="text-[#64748b]">Create users, assign roles and permissions.</p>
      </div>

      {/* Add User Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6 max-w-3xl">
        <h2 className="text-lg font-semibold mb-3">Add User</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          <input className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <select className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <input className="px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
        </div>
        <div className="mt-4">
          <button onClick={addUser} className="px-4 py-2.5 rounded-lg bg-[#1a1d2e] text-white hover:opacity-90">Create</button>
        </div>
      </div>

      {/* Users Table */}
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
                  <tr key={u.id} className="border-b border-[#f1f5f9]">
                    <td className="py-3 pr-4">{u.name}</td>
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-3 flex-wrap py-0.5">
                        {allRoles.map((r) => {
                          const selected = u.roles?.includes(r);
                          const Icon = r === 'admin' ? Shield : UserIcon;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                const next = new Set(u.roles || []);
                                if (selected) next.delete(r); else next.add(r);
                                const nextArr = Array.from(next);
                                // Optimistic UI update for the user's roles
                                setUsers((cur) => cur.map((usr) => usr.id === u.id ? { ...usr, roles: nextArr } : usr));
                                // Queue the backend update (debounced)
                                queueUserRolesUpdate(u.id, nextArr);
                              }}
                              className={`relative group px-3 py-2 rounded-lg border transition-colors
                                ${selected
                                  ? 'text-white border-transparent'
                                  : 'bg-white text-[#1a1d2e] border-[#e2e8f0] hover:border-[#cbd5e1]'}
                              `}
                              style={selected ? { backgroundImage: roleGradient(r) } : undefined}
                              aria-pressed={selected}
                              aria-label={`Toggle ${r} role`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${selected ? 'text-white' : 'text-[#64748b]'}`} />
                                <span className="text-sm font-medium capitalize">{r}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{u.active ? 'Yes' : 'No'}</td>
                    <td className="py-3 pr-4 flex gap-2">
                      <button
                        onClick={() => deactivate(u.id)}
                        disabled={!u.active}
                        className={`px-3 py-1.5 rounded-lg transition-all text-sm font-medium
                          ${u.active
                            ? 'text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40'
                            : 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'}
                        `}
                        style={u.active ? { backgroundImage: 'linear-gradient(to right, #f59e0b, #d97706)' } : undefined}
                      >
                        Deactivate
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#ef4444]/40 transition-all"
                        style={{ backgroundImage: 'linear-gradient(to right, #ef4444, #b91c1c)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {(['admin','user'] as Role[]).map((role) => (
            <div key={role} className="border border-[#e2e8f0] rounded-lg p-4">
              <h3 className="text-base font-semibold mb-2 capitalize">{role}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPermissions.map((p) => {
                  const selected = rolePerms[role]?.has(p);
                  // Determine icon/gradient by resource
                  let Icon: any = Shield; let gradient = 'from-[#4f46e5] to-[#4338ca]'; // indigo-600 to indigo-700
                  if (p.includes('assets')) { Icon = Package; gradient = 'from-[#ea580c] to-[#c2410c]'; } // orange-600 -> orange-700
                  else if (p.includes('licenses')) { Icon = FileText; gradient = 'from-[#db2777] to-[#be123c]'; } // pink-600 -> rose-700
                  else if (p.includes('vendors')) { Icon = Building2; gradient = 'from-[#0369a1] to-[#1d4ed8]'; } // sky-700 -> blue-700
                  else if (p.includes('events')) { Icon = Activity; gradient = 'from-[#16a34a] to-[#0f766e]'; } // green-600 -> teal-700

                  const label = p.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
                  return (
                    <button
                      key={`${role}-${p}`}
                      type="button"
                      onClick={() => {
                        const next = new Set(rolePerms[role] || []);
                        if (selected) next.delete(p); else next.add(p);
                        // Optimistic update
                        setRolePerms((cur) => ({ ...cur, [role]: next }));
                        // Queue backend update (debounced per role)
                        queueRolePermsUpdate(role, next);
                      }}
                      className={`relative group w-full text-left px-3 py-2.5 rounded-lg border transition-colors
                        ${selected
                          ? 'text-white border-transparent'
                          : 'bg-white text-[#1a1d2e] border-[#e2e8f0] hover:border-[#cbd5e1]'}
                      `}
                      style={selected ? { backgroundImage: permissionGradient(p) } : undefined}
                      aria-pressed={selected}
                      aria-label={`Toggle ${label} permission for ${role}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${selected ? 'text-white' : 'text-[#64748b]'}`} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
