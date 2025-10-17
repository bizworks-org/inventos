import { Home, Package, FileText, Users, Activity, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

export function Sidebar({ currentPage = 'dashboard' }: SidebarProps) {
  const pathname = usePathname();
  const pathById: Record<string, string> = {
    dashboard: '/dashboard',
    assets: '/assets',
    licenses: '/licenses',
    vendors: '/vendors',
    events: '/events',
    settings: '/settings',
  };

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
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = pathById[item.id];
          const isActive = pathname ? pathname.startsWith(href) : currentPage === item.id;

          return (
            <Link
              key={item.name}
              href={href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left w-full cursor-pointer
                ${isActive 
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/20' 
                  : 'text-[#a0a4b8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : item.colorClass ?? ''}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 border border-[#6366f1]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <span className="text-white font-semibold">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-[#a0a4b8] truncate">IT Administrator</p>
            </div>
            <button
              onClick={async (e) => { e.preventDefault(); (await import('@/lib/auth/client')).signOut(); }}
              className="ml-auto text-xs px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
