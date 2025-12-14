"use client";
import {
  Home,
  Package,
  FileText,
  Users,
  Activity,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Sanitize image URLs coming from untrusted sources (e.g., dataset or API).
// Allow only http(s) absolute URLs or specific safe data:image/... URIs (no SVG/text-based images).
// Return `null` for anything else to avoid DOM-based XSS via <img src>.
function sanitizeImageUrl(u?: string | null): string | null {
  if (!u) return null;
  try {
    const s = u.trim();

    // Disallow empty after trim
    if (!s) return null;

    // If running in a non-browser environment, only allow safe data: URLs (no http fetch on server)
    const runningInBrowser =
      typeof globalThis !== "undefined" && globalThis.window !== undefined;

    // Allow only a restricted set of raster image data URLs (explicitly disallow SVG and other text-based images).
    // We require base64 data for these types to avoid tricky encodings.
    const allowedDataImageRE =
      /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[A-Z0-9+/]+={0,2}$/i;
    if (s.startsWith("data:image/")) {
      // Normalize by removing whitespace then validate structure and mime type
      const normalized = s.split(/\s+/).join("");
      if (allowedDataImageRE.test(normalized)) return normalized;
      return null;
    }

    if (!runningInBrowser) return null;

    // Use the URL constructor to resolve relative URLs against the current origin.
    const parsed = new URL(s, globalThis.window.location.origin);

    // Only allow http(s) protocols; also reject overly long URLs to reduce abuse surface.
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.href.length < 2000
    ) {
      // Normalize and return the absolute href
      return parsed.href;
    }

    return null;
  } catch {
    return null;
  }
}

type Role = "admin" | "user" | "superadmin" | "auditor";

interface NavItem {
  name: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string; // tailwind text color class for icon when inactive
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    id: "dashboard",
    icon: Home,
    colorClass: "text-indigo-400",
  },
  {
    name: "IT Assets",
    id: "assets",
    icon: Package,
    colorClass: "text-emerald-400",
  },

  {
    name: "Licenses",
    id: "licenses",
    icon: FileText,
    colorClass: "text-pink-400",
  },
  { name: "Vendors", id: "vendors", icon: Users, colorClass: "text-amber-400" },
  {
    name: "Audits",
    id: "audits",
    icon: Activity,
    colorClass: "text-cyan-400",
  },
  {
    name: "Events",
    id: "events",
    icon: Activity,
    colorClass: "text-sky-300",
  },
  {
    name: "Settings",
    id: "settings",
    icon: Settings,
    colorClass: "text-violet-400",
  },
];

interface SidebarProps {
  currentPage?: string; // optional legacy prop; active is computed from pathname when available
}

export function Sidebar({
  currentPage = "dashboard",
  me: meProp,
}: SidebarProps & {
  me?: { id: string; email: string; role: Role; name?: string } | null;
}) {
  const pathname = usePathname();
  // Use server-provided user to avoid client fetch; fall back to undefined for SSR
  const [me, setMe] = useState<typeof meProp | undefined>(meProp ?? undefined);
  // Branding state (SSR-provided to avoid flicker)
  const [brandLogo, setBrandLogo] = useState<string | null>(() => {
    if (typeof document === "undefined") return null;
    const v = document.documentElement.dataset.brandLogo || "";
    return sanitizeImageUrl(v);
  });
  // Re-validate/sanitize at render-time to ensure any client-side changes are checked
  // before being used in a DOM-sensitive attribute like `src`.
  const [brandName, setBrandName] = useState<string>(() => {
    if (typeof document === "undefined") return "Inventos";
    return document.documentElement.dataset.brandName || "Inventos";
  });
  // Persist admin visibility once detected in the client session
  const [everAdmin, setEverAdmin] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.admin === "true";
  });
  // Track server-provided admin hint and react to changes immediately (e.g., right after login)
  const [serverAdminHint, setServerAdminHint] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.admin === "true";
  });
  const pathById: Record<string, string> = {
    dashboard: "/dashboard",
    assets: "/assets",
    audits: "/audits",
    licenses: "/licenses",
    vendors: "/vendors",
    events: "/events",
    settings: "/settings",
    admin: "/admin",
    admin_users: "/admin/users",
    admin_roles: "/admin/roles",
    // admin_catalog: '/admin/catalog',
    settings_events: "/events",
    settings_customization: "/settings/customization",
    settings_catalog: "/settings/customization",
    settings_general: "/settings",
    settings_configuration: "/settings/tech",
  };

  useEffect(() => {
    setMe(meProp ?? me);
  }, [meProp]);

  // Lazy-fetch branding if not provided by SSR
  useEffect(() => {
    if (brandLogo) return;
    (async () => {
      try {
        const res = await fetch("/api/branding", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.logoUrl) setBrandLogo(sanitizeImageUrl(data.logoUrl));
          if (data?.brandName) setBrandName(data.brandName);
        }
      } catch {}
    })();
  }, [brandLogo]);

  // When we know the user is admin (from me or server hint), latch everAdmin=true for this session
  useEffect(() => {
    const serverIsAdmin =
      typeof document === "undefined"
        ? false
        : document.documentElement.dataset.admin === "true";
    setServerAdminHint(serverIsAdmin);
    if (serverIsAdmin || me?.role === "admin" || me?.role === "superadmin")
      setEverAdmin(true);
  }, [me]);

  // Observe mutations to <html data-admin="…"> so admin links appear instantly after login without refresh
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    const update = () => {
      const adminV = el.dataset.admin === "true";
      setServerAdminHint(adminV);
      if (adminV) setEverAdmin(true);
      const logoV = el.dataset.brandLogo || "";
      setBrandLogo(sanitizeImageUrl(logoV));
      const nameV = el.dataset.brandName || "Inventos";
      setBrandName(nameV);
    };
    update();
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          update();
        }
      }
    });
    obs.observe(el, {
      attributes: true,
      attributeFilter: ["data-admin", "data-brand-logo", "data-brand-name"],
    });
    return () => obs.disconnect();
  }, []);

  const itemsToRender = useMemo(() => {
    // Prefer server hint if present to avoid waiting for client fetch
    const isAdminLike =
      serverAdminHint ||
      everAdmin ||
      me?.role === "admin" ||
      me?.role === "superadmin";

    // Start with base items
    const base: NavItem[] = [...navItems];
    const idx = base.findIndex((i) => i.id === "settings");
    if (idx !== -1) {
      const children: NavItem[] = [
        {
          name: "General",
          id: "settings_general",
          icon: Settings,
          colorClass: "text-violet-300",
        },
      ];
      if (isAdminLike) {
        children.push({
          name: "Customization",
          id: "settings_customization",
          icon: Package,
          colorClass: "text-rose-300",
        });
      }
      base.splice(idx + 1, 0, ...children);
    }

    if (isAdminLike) {
      base.push(
        {
          name: "Admin",
          id: "admin",
          icon: Shield,
          colorClass: "text-red-400",
        } as NavItem,
        {
          name: "Users",
          id: "admin_users",
          icon: Users,
          colorClass: "text-red-300",
        } as NavItem
        // ,
        // {
        //   name: "Roles",
        //   id: "admin_roles",
        //   icon: Shield,
        //   colorClass: "text-red-300 hidden",
        // } as NavItem
      );
    }
    return base;
  }, [serverAdminHint, everAdmin, me?.role]);

  const initials = useMemo(() => {
    const name = me?.name || "";
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return "US";
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase() || "US";
  }, [me]);

  // Keep non-admin items static even if me is unknown; avoid indefinite loading states
  const loadingProfile = false;

  // Sanitize the brand logo URL before using it in img src attribute
  // This prevents DOM-based XSS via script injection through src
  const safeSrc = sanitizeImageUrl(brandLogo ?? undefined);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-[#1a1d2e] to-[#0f1218] border-r border-[rgba(255,255,255,0.1)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[rgba(255,255,255,0.1)]">
        <Link href="/" className="flex items-center gap-3">
          {safeSrc ? (
            <img
              key={safeSrc}
              src={safeSrc}
              alt={brandName || "Logo"}
              referrerPolicy="no-referrer"
              onError={() => setBrandLogo(null)}
              className="h-8 w-8 rounded-lg object-contain bg-white"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-bold text-xl text-white">
            {brandName || "Inventos"}
          </span>
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
            if (item.id === "settings") {
              // Do not highlight the parent Settings item; only highlight its children
            } else if (item.id.startsWith("settings_") || item.id === "admin") {
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
              aria-current={isActive ? "page" : undefined}
              className={`
                flex items-center gap-3 ${
                  item.id.startsWith("admin_") ||
                  item.id.startsWith("settings_")
                    ? "pl-10 pr-4"
                    : "px-4"
                } text-[#a0a4b8] py-3 rounded-lg transition-colors duration-200 ease-out text-left w-full cursor-pointer
                ${
                  isActive
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/20"
                    : "text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              <Icon
                className={`h-5 w-5 transition-colors duration-200 ease-out ${
                  isActive ? "text-white" : item.colorClass ?? ""
                }`}
              />
              <span className="font-medium text-white transition-colors duration-200 ease-out">
                {item.name}
              </span>
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
                <p className="text-sm font-medium text-white truncate">
                  {me?.name || me?.email || "User"}
                </p>
                <p className="text-xs text-[#a0a4b8] truncate">
                  {(() => {
                    const role =
                      serverAdminHint ||
                      everAdmin ||
                      me?.role === "admin" ||
                      me?.role === "superadmin"
                        ? "Administrator"
                        : "User";
                    return role;
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
