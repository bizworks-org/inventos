"use client";
import { Home, Package, FileText, Users, Activity, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Role = 'admin' | 'user';

interface NavItem {
  name: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string; // tailwind text color class for icon when inactive
}

const navItems: NavItem[] = [
  { name: 'Dashboard', id: 'dashboard', icon: Home, colorClass: 'text-indigo-400' },
  { name: 'IT Assets', id: 'assets', icon: Package, colorClass: 'text-emerald-400' },
  { name: 'Licenses', id: 'licenses', icon: FileText, colorClass: 'text-pink-400' },
  { name: 'Vendors', id: 'vendors', icon: Users, colorClass: 'text-amber-400' },
  { name: 'Events', id: 'events', icon: Activity, colorClass: 'text-sky-400' },
  { name: 'Settings', id: 'settings', icon: Settings, colorClass: 'text-violet-400' },
];

interface SidebarProps {
  currentPage?: string; // optional legacy prop; active is computed from pathname when available
  onNavigate?: (page: string) => void; // legacy; no longer used
}

export function Sidebar({ currentPage = 'dashboard', me: meProp }: SidebarProps & { me?: { id: string; email: string; role: Role; name?: string } | null }) {
  const pathname = usePathname();
  // Use server-provided user to avoid client fetch; fall back to undefined for SSR
  const [me, setMe] = useState<typeof meProp | undefined>(meProp === undefined ? undefined : meProp);
  // Persist admin visibility once detected in the client session
  const [everAdmin, setEverAdmin] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-admin') === 'true';
  });
  const pathById: Record<string, string> = {
    dashboard: '/dashboard',
    assets: '/assets',
    licenses: '/licenses',
    vendors: '/vendors',
    events: '/events',
    settings: '/settings',
    admin: '/admin',
    admin_users: '/admin/users',
    admin_roles: '/admin/roles',
    admin_catalog: '/admin/catalog',
    settings_general: '/settings',
    settings_configuration: '/settings/tech',
  };

  useEffect(() => { setMe(meProp === undefined ? me : meProp); }, [meProp]);

  // When we know the user is admin (from me or server hint), latch everAdmin=true for this session
  useEffect(() => {
    const serverIsAdmin = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-admin') === 'true' : false;
    if (serverIsAdmin || me?.role === 'admin') setEverAdmin(true);
  }, [me]);

  const itemsToRender = useMemo(() => {
    // Prefer server hint if present to avoid waiting for client fetch
    const serverIsAdmin = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-admin') === 'true' : false;
    const isAdminLike = serverIsAdmin || everAdmin || me?.role === 'admin';

    // Start with base items
    const base: NavItem[] = [...navItems];
    const idx = base.findIndex((i) => i.id === 'settings');
    if (idx !== -1) {
      const children: NavItem[] = [
        { name: 'General', id: 'settings_general', icon: Settings, colorClass: 'text-violet-300' },
      ];
      if (isAdminLike) {
        children.push({ name: 'Configuration', id: 'settings_configuration', icon: Settings, colorClass: 'text-violet-300' });
      }
      base.splice(idx + 1, 0, ...children);
    }

    if (isAdminLike) {
      base.push(
        { name: 'Admin', id: 'admin', icon: Shield, colorClass: 'text-red-400' } as NavItem,
        { name: 'Users', id: 'admin_users', icon: Users, colorClass: 'text-red-300' } as NavItem,
        { name: 'Roles', id: 'admin_roles', icon: Shield, colorClass: 'text-red-300' } as NavItem,
        { name: 'Catalog', id: 'admin_catalog', icon: Package, colorClass: 'text-red-300' } as NavItem,
      );
    }
    return base;
  }, [everAdmin, me?.role]);

  const initials = useMemo(() => {
    const name = me?.name || '';
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return 'US';
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'US';
  }, [me]);

  // Keep non-admin items static even if me is unknown; avoid indefinite loading states
  const loadingProfile = false;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-[#1a1d2e] to-[#0f1218] border-r border-[rgba(255,255,255,0.1)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[rgba(255,255,255,0.1)]">
        <Link href={pathById.dashboard} className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40 rounded">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">Inventos</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {itemsToRender.map((item) => {
          const Icon = item.icon;
          const href = pathById[item.id];
          // Ensure Admin isn't highlighted when Users is active.
          let isActive = false;
          if (pathname) {
            if (item.id === 'settings') {
              // Do not highlight the parent Settings item; only highlight its children
              isActive = false;
            } else if (item.id.startsWith('settings_') || item.id === 'admin') {
              // Exact match for Settings sub-items and Admin root
              isActive = pathname === href || pathname === `${href}/`;
            } else {
              // Prefix match for all other sections (e.g., /assets, /licenses)
              isActive = pathname.startsWith(href);
            }
          } else {
            isActive = currentPage === item.id;
          }

          return (
            <Link
              key={item.name}
              href={href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex items-center gap-3 ${item.id.startsWith('admin_') || item.id.startsWith('settings_') ? 'pl-10 pr-4' : 'px-4'} py-3 rounded-lg transition-colors duration-200 ease-out text-left w-full cursor-pointer
                ${isActive
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/20'
                  : 'text-[#a0a4b8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                }
              `}
            >
              <Icon className={`h-5 w-5 transition-colors duration-200 ease-out ${isActive ? 'text-white' : item.colorClass ?? ''}`} />
              <span className="font-medium transition-colors duration-200 ease-out">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 border border-[#6366f1]/20 rounded-lg p-4">
          {loadingProfile ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-1/3 bg-white/10 rounded" />
              </div>
              <div className="h-6 w-16 rounded bg-white/10" />
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <span className="text-white font-semibold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{me?.name || me?.email || 'User'}</p>
                <p className="text-xs text-[#a0a4b8] truncate">{(() => {
                  const serverIsAdmin = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-admin') === 'true' : false;
                  const role = (serverIsAdmin || everAdmin || me?.role === 'admin') ? 'Administrator' : 'User';
                  return role;
                })()}</p>
              </div>
              <button
                onClick={async (e) => { e.preventDefault(); (await import('@/lib/auth/client')).signOut(); }}
                className="ml-auto text-xs px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
