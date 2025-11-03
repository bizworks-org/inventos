"use client";

import { Bell, Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

  const unreadCount = useMemo(() => items.filter(i => !i.read_at).length, [items]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
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

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors" aria-label="Notifications">
        <Bell className="h-5 w-5 text-[#1a1d2e]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 text-[10px] leading-4 bg-[#ef4444] text-white rounded-full border-2 border-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-semibold text-[#1a1d2e]">Notifications</span>
            <button disabled={markingAll || unreadCount === 0} onClick={markAllRead} className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${unreadCount === 0 ? 'text-[#94a3b8] cursor-not-allowed' : 'text-[#10b981] hover:bg-[#ecfdf5]' }`}>
              {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check className="h-3.5 w-3.5"/>}
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-auto divide-y">
            {loading ? (
              <div className="p-4 text-sm text-[#64748b]">Loading…</div>
            ) : error ? (
              <div className="p-4 text-sm text-[#ef4444]">{error}</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-[#64748b]">No notifications</div>
            ) : (
              items.map(i => (
                <div key={i.id} className={`p-4 hover:bg-[#f8f9ff] ${i.read_at ? '' : 'bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{i.title}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5">{i.body}</p>
                      <p className="text-[11px] text-[#9ca3af] mt-1">{new Date(i.created_at).toLocaleString()}</p>
                    </div>
                    {!i.read_at && (
                      <button onClick={() => markOneRead(i.id)} className="text-xs text-[#10b981] hover:underline">Mark read</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
