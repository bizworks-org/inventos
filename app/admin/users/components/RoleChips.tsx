"use client";
import { Shield, User as UserIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { Role, User } from "../types";

export function RoleChips({
  user,
  allRoles,
  meId,
  meLoading = false,
  activeAdminCount, // reserved if later needed
  onApplyRole,
  onConfirmRemoveAdmin,
  meRole,
}: {
  user: User;
  allRoles: Role[];
  meId?: string;
  meLoading?: boolean;
  activeAdminCount: number;
  onApplyRole: (userId: string, role: Role) => void;
  onConfirmRemoveAdmin: (
    userId: string,
    userName: string,
    nextRole: Role
  ) => void;
  meRole?: Role;
}) {
  // viewerRole is optionally provided via me.role; if the viewer is not a superadmin
  // we render non-interactive labels for all rows. (Only Superadmin sees editable chips.)
  // Note: callers may pass `meRole` via props in future; default behavior is to rely
  // on `meId` only when needed.
  const getCurrentRole = (u: User): Role => {
    const roles = (u.roles || []) as Role[];
    if (roles.includes("superadmin")) return "superadmin";
    if (roles.includes("admin")) return "admin";
    if (roles.includes("user")) return "user";
    return (roles[0] as Role) || "user";
  };
  const roleGradient = (r: Role) =>
    r === "admin"
      ? "linear-gradient(to right, #ec4899, #f43f5e)"
      : "linear-gradient(to right, #10b981, #14b8a6)";
  const canEditRoles = (u: User, viewerIsSuper: boolean) => {
    if (viewerIsSuper) return true;
    const hasAdmin = (u.roles || []).includes("admin");
    const isSelf = meId === u.id;
    return !(hasAdmin && !isSelf);
  };

  const isOtherAdmin = (user.roles || []).includes("admin") && meId !== user.id;
  const isSuperadmin = (user.roles || []).includes("superadmin");

  // Determine if the current viewer is a Superadmin by inspecting the meId row
  // Caller should pass `meId` and server-provided me.role to the parent; here we
  // cannot read the viewer's role directly, so the parent should control visibility.

  if (isSuperadmin) {
    // Superadmin users are immutable — render a distinct non-interactive badge.
    return (
      <div className="flex gap-3 flex-wrap py-0.5">
        <span
          className="px-3 py-2 rounded-lg inline-flex items-center gap-2 text-white font-semibold"
          style={{
            backgroundImage: "linear-gradient(to right, #f59e0b, #f97316)",
            borderColor: "rgba(249, 115, 22, 0.12)",
          }}
          aria-hidden
        >
          <Shield className="h-4 w-4 text-white" />
          <span className="text-sm">Superadmin</span>
        </span>
      </div>
    );
  }

  if (meLoading) {
    return (
      <div className="flex gap-3 flex-wrap py-0.5">
        {allRoles.map((r) => (
          <button
            key={r}
            type="button"
            disabled
            className="relative group px-3 py-2 rounded-lg border bg-white text-transparent opacity-60 cursor-wait"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-3 w-14 bg-slate-200 rounded animate-pulse" />
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Note: Role visibility and interactivity are controlled by the caller (page.tsx).
  // If the caller wants only Superadmin to edit roles, it should pass the viewer's
  // role and render RoleChips accordingly. For backward compatibility, when the
  // caller does not indicate viewer role, we preserve the previous behavior.

  return (
    <div className="flex gap-3 flex-wrap py-0.5">
      {allRoles.map((r) => {
        const currentRole = getCurrentRole(user);
        const selected = currentRole === r;
        const Icon = r === "admin" ? Shield : UserIcon;
        const isSelf = meId === user.id;
        const viewerIsSuper = meRole === "superadmin";
        const editable = canEditRoles(user, viewerIsSuper);
        const disableInteraction = !editable || selected;
        const handleClick = () => {
          if (disableInteraction) return;
          const nextRole = r as Role;
          // If the viewer is Superadmin, allow direct changes (no confirmation)
          if (viewerIsSuper) {
            onApplyRole(user.id, nextRole);
            return;
          }
          // For non-superadmin viewers, keep the admin->user confirmation flow
          if (currentRole === "admin" && nextRole !== "admin") {
            onConfirmRemoveAdmin(user.id, user.name || user.email, nextRole);
            return;
          }
          onApplyRole(user.id, nextRole);
        };
        const button = (
          <button
            key={r}
            type="button"
            onClick={handleClick}
            disabled={disableInteraction}
            className={`relative group px-3 py-2 rounded-lg border transition-colors ${
              selected
                ? "text-white border-transparent"
                : "bg-white text-[#1a1d2e] border-[#e2e8f0] hover:border-[#cbd5e1]"
            } ${disableInteraction ? "opacity-60 cursor-not-allowed" : ""}`}
            style={
              selected
                ? { backgroundImage: roleGradient(r as Role) }
                : undefined
            }
            aria-pressed={selected}
            aria-label={`Select ${r} role`}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={`h-4 w-4 ${
                  selected ? "text-white" : "text-[#64748b]"
                }`}
              />
              <span className="text-sm font-medium capitalize">{r}</span>
            </div>
          </button>
        );
        if (!editable) {
          return (
            <Tooltip key={r}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>
                Cannot modify roles of another Admin
              </TooltipContent>
            </Tooltip>
          );
        }
        return button;
      })}
    </div>
  );
}
