"use client";
import { Pencil } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { Role, User } from "../types";

export function UserActions({
  user,
  meId,
  activeAdminCount,
  onEdit,
  onActivate,
  onDeactivate,
  onResetPassword,
  onRemove,
  meRole,
  visiblePassword,
  rowDisabled,
}: Readonly<{
  user: User;
  meId?: string;
  activeAdminCount: number;
  onEdit: (user: User) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onResetPassword: (id: string) => void;
  onRemove: (id: string) => void;
  meRole?: Role;
  visiblePassword?: string;
  rowDisabled?: boolean;
}>) {
  const isSelf = meId === user.id;
  const targetIsSuper = (user.roles || []).includes("superadmin");
  const targetIsAdmin = (user.roles || []).includes("admin");
  const isLastActiveAdmin =
    user.active && targetIsAdmin && activeAdminCount === 1;

  // Determine visibility based on role hierarchy
  // SuperAdmin: sees all users
  // Admin: sees self and all users (except other admins and superadmins)
  // User: sees only self
  const canViewActions = (() => {
    if (meRole === "superadmin") return true; // SuperAdmin sees all
    if (meRole === "admin") {
      if (isSelf) return true; // Admin sees self
      if (!targetIsAdmin && !targetIsSuper) return true; // Admin sees users
      return false; // Admin doesn't see other admins or superadmins
    }
    if (meRole === "user") return isSelf; // User sees only self
    return false;
  })();

  if (!canViewActions) return null;

  // If the user is currently deactivated, only show the Activate button
  // (and avoid rendering Edit/Reset/Delete). This mirrors the optimistic
  // behavior when deactivating: the row is highlighted and other actions
  // are hidden/disabled.
  if (!user.active) {
    return (
      <div className="flex gap-2 items-center">
        <button
          onClick={() => onActivate(user.id)}
          disabled={!!rowDisabled}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          style={
            rowDisabled
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(to right, #10b981, #059669)",
                }
          }
        >
          Activate
        </button>
        {visiblePassword && (
          <div className="ml-3 flex items-center gap-2">
            <span className="px-3 py-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-sm font-medium font-mono">
              {visiblePassword}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      {/* Edit - always visible when canViewActions is true */}
      <button
        type="button"
        onClick={() => onEdit(user)}
        disabled={!!rowDisabled}
        className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
          rowDisabled
            ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
            : "text-white hover:shadow-md"
        }`}
        style={
          rowDisabled
            ? undefined
            : { backgroundImage: "linear-gradient(to right, #6366f1, #8b5cf6)" }
        }
      >
        <span className="inline-flex items-center gap-1">
          <Pencil className="h-4 w-4" /> Edit
        </span>
      </button>
      {/* Activate */}
      {!user.active && (
        <button
          onClick={() => onActivate(user.id)}
          className="px-3 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          style={{
            backgroundImage: "linear-gradient(to right, #10b981, #059669)",
          }}
        >
          Activate
        </button>
      )}
      {/* Deactivate */}
      {(() => {
        const shouldShow =
          user.active &&
          (isSelf ||
            meRole === "superadmin" ||
            (!targetIsAdmin && !targetIsSuper));
        const shouldDisableDeactivate =
          isSelf && targetIsAdmin && isLastActiveAdmin;

        if (!shouldShow) return null;

        return (
          <button
            onClick={() => onDeactivate(user.id)}
            disabled={shouldDisableDeactivate || !!rowDisabled}
            className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
              shouldDisableDeactivate || rowDisabled
                ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                : "text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40"
            }`}
            style={
              shouldDisableDeactivate || rowDisabled
                ? undefined
                : {
                    backgroundImage:
                      "linear-gradient(to right, #f59e0b, #d97706)",
                  }
            }
          >
            Deactivate
          </button>
        );
      })()}
      {/* Reset Password & Delete */}
      {(() => {
        // Show Reset Password and Delete only when:
        // 1. Viewing self, OR
        // 2. SuperAdmin viewing any user, OR
        // 3. Admin viewing a regular user (not admin/superadmin)
        const shouldShow =
          isSelf ||
          meRole === "superadmin" ||
          (meRole === "admin" && !targetIsAdmin && !targetIsSuper);

        if (!shouldShow) return null;

        return (
          <>
            <button
              onClick={() => onResetPassword(user.id)}
              disabled={!!rowDisabled}
              className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all ${
                rowDisabled
                  ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                  : "text-white hover:shadow-md"
              }`}
              style={
                rowDisabled
                  ? undefined
                  : {
                      backgroundImage:
                        "linear-gradient(to right, #06b6d4, #3b82f6)",
                    }
              }
            >
              Reset Password
            </button>
            <button
              onClick={() => onRemove(user.id)}
              disabled={!!rowDisabled}
              className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/40 transition-all ${
                rowDisabled
                  ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                  : "text-white hover:shadow-md"
              }`}
              style={
                rowDisabled
                  ? undefined
                  : {
                      backgroundImage:
                        "linear-gradient(to right, #ef4444, #b91c1c)",
                    }
              }
            >
              Delete
            </button>
          </>
        );
      })()}
      {/* Inline visible password (expires in ~60s) */}
      {visiblePassword && (
        <div className="ml-3 flex items-center gap-2">
          <span className="px-3 py-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-sm font-medium font-mono">
            {visiblePassword}
          </span>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(visiblePassword);
                toast.success("Password copied");
              } catch {
                // fallback
                try {
                  const ta = document.createElement("textarea");
                  ta.value = visiblePassword;
                  ta.style.position = "fixed";
                  ta.style.top = "-1000px";
                  document.body.appendChild(ta);
                  ta.select();
                  (document as any).execCommand("copy");
                  ta.remove();
                  toast.success("Password copied");
                } catch {
                  toast.error("Copy failed");
                }
              }
            }}
            className="px-2 py-1 rounded bg-[#111827] text-white text-sm"
          >
            Copy
          </button>
          <span className="text-xs text-[#64748b]">Visible for 60s</span>
        </div>
      )}
    </div>
  );
}
