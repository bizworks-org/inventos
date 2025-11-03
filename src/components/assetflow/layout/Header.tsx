import { Search, User } from 'lucide-react';
import { useState } from 'react';
import { NotificationsBell } from './NotificationsBell';

interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  onSearch?: (query: string) => void;
}

export function Header({ breadcrumbs = [], onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-lg">
      <div className="flex h-full items-center justify-between px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-[#a0a4b8]">/</span>}
                {crumb.href ? (
                  <a 
                    href={crumb.href}
                    className="text-[#6366f1] hover:text-[#8b5cf6] font-medium transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[#1a1d2e] font-medium">{crumb.label}</span>
                )}
              </div>
            ))
          ) : (
            <span className="text-[#1a1d2e] font-medium">Dashboard</span>
          )}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, licenses, vendors..."
              className="
                w-80 pl-10 pr-4 py-2 rounded-lg
                bg-[#f3f4f6] border border-transparent
                text-sm text-[#1a1d2e] placeholder:text-[#a0a4b8]
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200
              "
            />
          </form>

          {/* Notifications */}
          <NotificationsBell />

          {/* User Profile */}
          <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
