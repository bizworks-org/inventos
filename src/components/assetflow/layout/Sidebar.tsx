import { Home, Package, FileText, Users, Activity, Brain, Settings } from 'lucide-react';

interface NavItem {
  name: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', id: 'dashboard', icon: Home },
  { name: 'IT Assets', id: 'assets', icon: Package },
  { name: 'Licenses', id: 'licenses', icon: FileText },
  { name: 'Vendors', id: 'vendors', icon: Users },
  { name: 'Events', id: 'events', icon: Activity },
  { name: 'Predictive Analytics', id: 'predictive-analytics', icon: Brain },
  { name: 'Settings', id: 'settings', icon: Settings },
];

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Sidebar({ currentPage = 'dashboard', onNavigate }: SidebarProps) {

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-[#1a1d2e] to-[#0f1218] border-r border-[rgba(255,255,255,0.1)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">AssetFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.name}
              onClick={() => onNavigate?.(item.id)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left w-full
                ${isActive 
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/20' 
                  : 'text-[#a0a4b8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
              <span className="font-medium">{item.name}</span>
            </button>
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
          </div>
        </div>
      </div>
    </aside>
  );
}
