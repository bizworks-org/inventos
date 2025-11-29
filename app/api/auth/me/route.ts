import { NextResponse } from "next/server";
import {
  dbFindUserById,
  dbGetUserPermissions,
  dbListPermissions,
} from "@/lib/auth/db-users";
import { readMeFromCookie } from "@/lib/auth/permissions";

export async function GET() {
  const me = await readMeFromCookie();
  if (!me?.id) return NextResponse.json({ user: null }, { status: 200 });
  const user = await dbFindUserById(me.id);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  let role: "admin" | "user" | "superadmin" = "user";
  if (Array.isArray(user.roles) && user.roles.includes("superadmin")) {
    role = "superadmin";
  } else if (Array.isArray(user.roles) && user.roles.includes("admin")) {
    role = "admin";
  }
  let permissions: string[] = [];
  if (role === "admin" || role === "superadmin") {
    // Admins should have all permissions (UI and API should treat admins as unrestricted)
    try {
      permissions = await dbListPermissions();
    } catch (e) {
      console.error("Failed to list permissions, falling back to user-specific permissions:", e);
      permissions = await dbGetUserPermissions(user.id);
    }
  } else {
    permissions = await dbGetUserPermissions(user.id);
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role,
      roles: user.roles,
      permissions,
      name: user.name,
    },
  });
}
