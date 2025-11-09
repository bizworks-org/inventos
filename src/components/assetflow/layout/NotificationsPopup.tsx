"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

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

type Props = {
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  markingAll: boolean;
  unreadCount: number;
  onMarkAll: () => void;
  onMarkOne: (id: number) => void;
  onClose: () => void;
};

export default function NotificationsPopup({ items, loading, error, markingAll, unreadCount, onMarkAll, onMarkOne, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape and focus management
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // focus the container for accessibility
    requestAnimationFrame(() => containerRef.current?.focus());
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Notifications"
      tabIndex={-1}
      className="absolute right-0 mt-2 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl shadow-lg overflow-hidden z-50 flex flex-col"
      style={{ width: 480, maxHeight: 360 }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <span className="text-sm font-semibold text-[#1a1d2e]">Notifications</span>
        <button
          disabled={markingAll || unreadCount === 0}
          onClick={onMarkAll}
          className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${unreadCount === 0 ? 'text-[#94a3b8] cursor-not-allowed' : 'text-[#10b981] hover:bg-[#ecfdf5]' }`}
        >
          {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check className="h-3.5 w-3.5"/>}
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
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
                  <p className="text-[11px] text-[#9ca3af] mt-1" suppressHydrationWarning>
                    {new Date(i.created_at).toLocaleString()}
                  </p>
                </div>
                {!i.read_at && (
                  <button onClick={() => onMarkOne(i.id)} className="text-xs w-10 text-[#10b981] hover:underline">Mark read</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
