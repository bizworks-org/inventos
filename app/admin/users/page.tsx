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
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Admin • Manage Users</h1>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', marginBottom: 24, maxWidth: 700 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Add User</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
        </div>
        <div>
          <button onClick={addUser} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }}>Create</button>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 10 }}>Users</h2>
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p style={{ color: '#ef4444' }}>{error}</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Roles</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Active</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {allRoles.map((r) => {
                        const checked = u.roles?.includes(r);
                        return (
                          <label key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                  <td style={{ padding: 8 }}>{u.active ? 'Yes' : 'No'}</td>
                  <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => deactivate(u.id)} disabled={!u.active}>Deactivate</button>
                    <button onClick={() => remove(u.id)} style={{ color: '#ef4444' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 10 }}>Role Permissions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
          {(['admin','user'] as Role[]).map((role) => (
            <div key={role} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>{role}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {allPermissions.map((p) => {
                  const checked = rolePerms[role]?.has(p);
                  return (
                    <label key={`${role}-${p}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
      </section>
    </main>
  );
}
