"use client";
import { useEffect, useRef, useState } from 'react';
import { Shield, Package, FileText, Building2, Activity } from 'lucide-react';

type Role = 'admin' | 'user';

export default function RolesPermissionsPage() {
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<Role, Set<string>>>({ admin: new Set(), user: new Set() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const permissionGradient = (p: string) => {
    if (p.includes('assets')) return 'linear-gradient(to right, #f59e0b, #f97316)';
    if (p.includes('licenses')) return 'linear-gradient(to right, #ec4899, #f43f5e)';
    if (p.includes('vendors')) return 'linear-gradient(to right, #06b6d4, #3b82f6)';
    if (p.includes('events')) return 'linear-gradient(to right, #22c55e, #14b8a6)';
    return 'linear-gradient(to right, #6366f1, #8b5cf6)';
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/rbac/roles').then(r => r.json()).catch(() => ({ roles: [] })),
      fetch('/api/admin/rbac/permissions').then(r => r.json()).catch(() => ({ permissions: [] })),
      fetch('/api/admin/rbac/role-permissions?role=admin').then(r => r.json()).catch(() => ({ role: 'admin', permissions: [] })),
      fetch('/api/admin/rbac/role-permissions?role=user').then(r => r.json()).catch(() => ({ role: 'user', permissions: [] })),
    ])
      .then(([r1, r2, rpA, rpU]) => {
        setAllRoles(r1.roles || []);
        setAllPermissions(r2.permissions || []);
        setRolePerms({
          admin: new Set(rpA.permissions || []),
          user: new Set(rpU.permissions || []),
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load roles/permissions');
        setLoading(false);
      });
  }, []);

  // Debounced updates per role
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

  const iconFor = (p: string) => {
    if (p.includes('assets')) return Package;
    if (p.includes('licenses')) return FileText;
    if (p.includes('vendors')) return Building2;
    if (p.includes('events')) return Activity;
    return Shield;
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1d2e]">Roles & Permissions</h1>
        <p className="text-[#64748b]">Configure what each role is allowed to do.</p>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-[#ef4444]">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {allRoles.map((role) => (
              <div key={role} className="border border-[#e2e8f0] rounded-lg p-4">
                <h3 className="text-base font-semibold mb-2 capitalize">{role}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPermissions.map((p) => {
                    const selected = rolePerms[role as Role]?.has(p);
                    const Icon = iconFor(p);
                    const label = p.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
                    return (
                      <button
                        key={`${role}-${p}`}
                        type="button"
                        onClick={() => {
                          const next = new Set(rolePerms[role as Role] || []);
                          if (selected) next.delete(p); else next.add(p);
                          setRolePerms((cur) => ({ ...cur, [role as Role]: next }));
                          queueRolePermsUpdate(role as Role, next);
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
        )}
      </div>
    </>
  );
}
