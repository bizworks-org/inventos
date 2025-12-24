"use client";

import { Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NotificationsBell } from "./NotificationsBell";
import { useMe } from "./MeContext";

interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  onSearch?: (query: string) => void;
}

export function Header({ breadcrumbs = [], onSearch }: Readonly<HeaderProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const { me } = useMe();
  const { profileOpen, setProfileOpen, profileRef } = useProfileMenu();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
      <div className="flex h-full items-center justify-between px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => {
              const isHome = String(crumb.label).toLowerCase() === "home";
              const href =
                isHome && (crumb.href === "#" || !crumb.href)
                  ? "/dashboard"
                  : crumb.href;
              return (
                <div key={`${crumb.label}-${crumb.href || index}`} className="flex items-center gap-2">
                  {index > 0 && <span className="text-[#a0a4b8]">/</span>}
                  {href ? (
                    <a
                      href={href}
                      className="text-[#6366f1] hover:text-[#8b5cf6] font-medium transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              Dashboard
            </span>
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
                bg-gray-100 dark:bg-gray-800 border border-transparent
                text-sm text-gray-900 dark:text-gray-100 placeholder:text-[#a0a4b8]
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200
              "
            />
          </form>

          {/* Notifications */}
          <NotificationsBell />

          {/* User Profile */}
          <div className="relative">
            <button
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span
                className="hidden md:block text-sm text-gray-900 dark:text-gray-100 font-medium max-w-[180px] truncate"
                title={me?.name || me?.email || undefined}
              >
                {me?.name || me?.email || "User"}
              </span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>

            {profileOpen && (
              <div
                ref={profileRef}
                className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
              >
                <div className="flex flex-col py-2">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      (await import("@/lib/auth/client")).signOut();
                    }}
                    className="text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// local component state/hooks
function useProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return {
    profileOpen: open,
    setProfileOpen: setOpen,
    profileRef: ref,
  } as const;
}
