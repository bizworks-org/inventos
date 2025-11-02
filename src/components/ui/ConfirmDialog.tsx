"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title?: string;
  readonly description?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly danger?: boolean;
  readonly showForce?: boolean;
  readonly forceLabel?: string;
  readonly busy?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (force?: boolean) => Promise<void> | void;
}

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  showForce = false,
  forceLabel = 'Delete anyway',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const id = setTimeout(() => confirmRef.current?.focus(), 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        // Focus trap: find focusable elements inside container
        const container = containerRef.current;
        if (!container) return;
        const focusable = Array.from(container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter((el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
        if (focusable.length === 0) return;
        const first = focusable[0];
  const last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(id); document.removeEventListener('keydown', onKey); if (prev) prev.focus(); };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        aria-hidden
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.dialog
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[rgba(0,0,0,0.08)] p-6"
          aria-label={title}
          ref={containerRef}
        >
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
            {description && <p className="text-sm text-[#64748b] mt-1">{description}</p>}
          </div>
          {children}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border bg-white"
              aria-label={cancelLabel}
            >
              {cancelLabel}
            </button>

            <button
              onClick={() => onConfirm(false)}
              ref={confirmRef}
              disabled={busy}
              className={`px-4 py-2 rounded-lg border ${danger ? 'bg-white text-[#ef4444] border-[#fecaca] hover:bg-[#fff1f2]' : 'bg-[#ef4444] text-white'}`}
              aria-label={confirmLabel}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>

            {showForce && (
              <button
                onClick={() => onConfirm(true)}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#ef4444] text-white"
                aria-label={forceLabel}
              >
                {forceLabel}
              </button>
            )}
          </div>
        </motion.dialog>
      </div>
    </>
  );
}
