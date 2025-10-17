"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const updateUserRoles = async (id: string, roles: Role[]) => {
    const res = await fetch('/api/admin/rbac/user-roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, roles }) });
    if (!res.ok) return alert('Update failed');
    load();
  };

  const deactivate = async (id: string) => {
    const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: false }) });
    if (!res.ok) return alert('Update failed');
    load();
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
                          const checked = u.roles?.includes(r);
                          return (
                            <label key={r} className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={!!checked}
                                onChange={(e) => {
                                  const next = new Set(u.roles || []);
                                  if (e.target.checked) next.add(r); else next.delete(r);
                                  updateUserRoles(u.id, Array.from(next));
                                }}
                              />
                              <span>{r}</span>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{u.active ? 'Yes' : 'No'}</td>
                    <td className="py-3 pr-4 flex gap-2">
                      <button onClick={() => deactivate(u.id)} disabled={!u.active} className="px-3 py-1.5 rounded bg-[#f1f5f9] text-[#1a1d2e] disabled:opacity-50">Deactivate</button>
                      <button onClick={() => remove(u.id)} className="px-3 py-1.5 rounded bg-[#fee2e2] text-[#b91c1c]">Delete</button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allPermissions.map((p) => {
                  const checked = rolePerms[role]?.has(p);
                  return (
                    <label key={`${role}-${p}`} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={async (e) => {
                          const next = new Set(rolePerms[role] || []);
                          if (e.target.checked) next.add(p); else next.delete(p);
                          // optimistic update
                          setRolePerms((cur) => ({ ...cur, [role]: next }));
                          const res = await fetch('/api/admin/rbac/role-permissions', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role, permissions: Array.from(next) })
                          });
                          if (!res.ok) alert('Failed to update permissions');
                        }}
                      />
                      <span>{p}</span>
                    </label>
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
