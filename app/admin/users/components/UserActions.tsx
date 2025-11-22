"use client";
import { Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
}: {
  user: User;
  meId?: string;
  activeAdminCount: number;
  onEdit: (user: User) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onResetPassword: (id: string) => void;
  onRemove: (id: string) => void;
  meRole?: Role;
}) {
  const isTargetAdmin = (user.roles || []).includes("admin");
  const isOtherAdmin = isTargetAdmin && meId !== user.id;
  const isLastActiveAdmin =
    user.active && isTargetAdmin && activeAdminCount === 1;
  const disableEdit = isTargetAdmin && meId !== user.id;
  const disableOthersAdmin = isTargetAdmin && meId !== user.id;
  const targetIsSuper = (user.roles || []).includes("superadmin");

  // If this row represents a Superadmin and the current viewer is not a Superadmin,
  // hide action buttons entirely to prevent Admin/User viewers from operating on Superadmin.
  if (targetIsSuper && meRole !== "superadmin") return null;
  // If this row represents another Admin (not the current user), hide action buttons entirely.
  if (isOtherAdmin) return null;

  return (
    <div className="flex gap-2 items-center">
      {/* Edit */}
      {(() => {
        const btn = (
          <button
            type="button"
            onClick={() => {
              if (disableEdit) return;
              onEdit(user);
            }}
            disabled={disableEdit}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              disableEdit
                ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                : "text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            }`}
            style={
              disableEdit
                ? undefined
                : {
                    backgroundImage:
                      "linear-gradient(to right, #6366f1, #8b5cf6)",
                  }
            }
          >
            <span className="inline-flex items-center gap-1">
              <Pencil className="h-4 w-4" /> Edit
            </span>
          </button>
        );
        if (!disableEdit) return btn;
        return (
          <Tooltip>
            <TooltipTrigger asChild>{btn}</TooltipTrigger>
            <TooltipContent>Cannot edit another Admin</TooltipContent>
          </Tooltip>
        );
      })()}
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
        const disabled = !user.active || isLastActiveAdmin || isOtherAdmin;
        const btn = (
          <button
            onClick={() => onDeactivate(user.id)}
            disabled={disabled}
            className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
              disabled
                ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                : "text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40"
            }`}
            style={
              disabled
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
        if (!(isLastActiveAdmin || isOtherAdmin)) return btn;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">{btn}</span>
            </TooltipTrigger>
            <TooltipContent>
              {isLastActiveAdmin
                ? "Cannot deactivate the last active Admin"
                : "Cannot deactivate another Admin"}
            </TooltipContent>
          </Tooltip>
        );
      })()}
      {/* Reset Password & Delete */}
      {(() => {
        const resetBtn = (
          <button
            onClick={() => !disableOthersAdmin && onResetPassword(user.id)}
            disabled={disableOthersAdmin}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              disableOthersAdmin
                ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                : "text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            }`}
            style={
              disableOthersAdmin
                ? undefined
                : {
                    backgroundImage:
                      "linear-gradient(to right, #06b6d4, #3b82f6)",
                  }
            }
          >
            Reset Password
          </button>
        );
        const deleteBtn = (
          <button
            onClick={() => !disableOthersAdmin && onRemove(user.id)}
            disabled={disableOthersAdmin}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              disableOthersAdmin
                ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
                : "text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#ef4444]/40"
            }`}
            style={
              disableOthersAdmin
                ? undefined
                : {
                    backgroundImage:
                      "linear-gradient(to right, #ef4444, #b91c1c)",
                  }
            }
          >
            Delete
          </button>
        );
        if (!disableOthersAdmin)
          return (
            <>
              {resetBtn}
              {deleteBtn}
            </>
          );
        return (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">{resetBtn}</span>
              </TooltipTrigger>
              <TooltipContent>
                Cannot reset password for another Admin
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">{deleteBtn}</span>
              </TooltipTrigger>
              <TooltipContent>Cannot delete another Admin</TooltipContent>
            </Tooltip>
          </>
        );
      })()}
    </div>
  );
}
