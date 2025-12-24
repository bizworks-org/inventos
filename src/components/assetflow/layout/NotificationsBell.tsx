"use client";

import { Bell } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import NotificationsPopup from './NotificationsPopup';
import { Button } from '@/components/ui/button';


export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: any;
  read_at?: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false); // NEW

  useEffect(() => { setMounted(true); }, []); // NEW

  const unreadCount = useMemo(() => items.filter(i => !i.read_at).length, [items]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load notifications");
      setItems((data?.items as NotificationItem[]) || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", { method: "PUT" });
      if (res.ok) {
        setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, read_at: i.read_at || new Date().toISOString() } : i));
      }
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    fetchItems();
  }, [open]);

  // Poll occasionally to keep fresh while open
  useEffect(() => {
    if (!open) return;
    const t = setInterval(fetchItems, 30000);
    return () => clearInterval(t);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Initial fetch to update badge count even when closed
  useEffect(() => {
    fetchItems().catch(() => void 0);
    // Listen for programmatic open/refresh events
    const openHandler = () => {
      setOpen(true);
      fetchItems().catch(() => void 0);
    };
    const refreshHandler = () => {
      fetchItems().catch(() => void 0);
    };

    const eventTarget = globalThis as unknown as Window;

    eventTarget.addEventListener('open-notifications', openHandler as EventListener);
    eventTarget.addEventListener('refresh-notifications', refreshHandler as EventListener);
    return () => {
      eventTarget.removeEventListener('open-notifications', openHandler as EventListener);
      eventTarget.removeEventListener('refresh-notifications', refreshHandler as EventListener);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setOpen(o => !o)} 
      variant="destructive"
      //className="relative p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors" 
      className={`transition-all duration-200 group`}
      aria-label="Notifications">
        <Bell className="h-5 w-5 text-[#1a1d2e]" />
        {mounted && unreadCount > 0 && ( // render badge only after mount to avoid SSR diff
          // <span className="absolute top-4 right-4 min-w-4 h-4 px-1 text-[2px] leading-4  bg-[#ef4444] bg-whi_te rounded-full border-1 border-white flex items-center justify-center" suppressHydrationWarning>
           <span className="absolute top-2 right-4 w-7 h-8 px-2 text-s leading-4 bg-[#ef4444] rounded-full flex items-center justify-center" suppressHydrationWarning>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      {mounted && open && (
        <NotificationsPopup
          items={items}
          loading={loading}
          error={error}
          markingAll={markingAll}
          unreadCount={unreadCount}
          onMarkAll={markAllRead}
          onMarkOne={markOneRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
