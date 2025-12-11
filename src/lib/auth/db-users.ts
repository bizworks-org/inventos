import { randomUUID } from "@/lib/node-crypto.server";
import { query } from "@/lib/db";
import type { Role } from "./server";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  active: number;
  roles: Role[];
  password_hash?: string;
};

async function getRoleIdByName(name: Role): Promise<number | null> {
  const rows = await query<{ id: number }>(
    "SELECT id FROM roles WHERE name = :name LIMIT 1",
    { name }
  );
  return rows[0]?.id ?? null;
}

export async function dbFindUserByEmail(email: string): Promise<DbUser | null> {
  const rows = await query<any>(
    `SELECT u.id, u.email, u.name, u.active, u.password_hash,
            GROUP_CONCAT(r.name) AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = :email
      GROUP BY u.id
      LIMIT 1`,
    { email }
  );
  if (!rows.length) return null;
  const row = rows[0];
  const roles: Role[] = (
    row.role_names ? String(row.role_names).split(",") : []
  ) as Role[];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    active: row.active,
    roles,
    password_hash: row.password_hash,
  };
}

export async function dbFindUserById(id: string): Promise<DbUser | null> {
  const rows = await query<any>(
    `SELECT u.id, u.email, u.name, u.active,
            GROUP_CONCAT(r.name) AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = :id
      GROUP BY u.id
      LIMIT 1`,
    { id }
  );
  if (!rows.length) return null;
  const row = rows[0];
  const roles: Role[] = (
    row.role_names ? String(row.role_names).split(",") : []
  ) as Role[];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    active: row.active,
    roles,
  };
}

export async function dbListUsers(): Promise<DbUser[]> {
  const rows = await query<any>(
    `SELECT u.id, u.email, u.name, u.active,
            GROUP_CONCAT(r.name) AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.created_at DESC`
  );
  return rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    active: row.active,
    roles: (row.role_names ? String(row.role_names).split(",") : []) as Role[],
  }));
}

export async function dbCreateUser(input: {
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  active?: boolean;
}): Promise<DbUser> {
  const id = randomUUID();
  await query(
    `INSERT INTO users (id, email, name, password_hash, active) 
     VALUES (:id, :email, :name, :password_hash, :active)`,
    {
      id,
      email: input.email,
      name: input.name,
      password_hash: input.password_hash,
      active: input.active ?? true,
    }
  );
  const roleId = await getRoleIdByName(input.role);
  if (roleId) {
    await query(
      `INSERT INTO user_roles (user_id, role_id) VALUES (:id, :roleId)`,
      { id, roleId }
    );
  }
  const user = await dbFindUserById(id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function dbUpdateUser(
  id: string,
  patch: Partial<{
    name: string;
    email: string;
    active: boolean;
    role: Role;
    roles: Role[];
  }>
): Promise<DbUser | null> {
  if (
    patch.name !== undefined ||
    patch.email !== undefined ||
    patch.active !== undefined
  ) {
    const sets: string[] = [];
    const params: any = { id };
    if (patch.name !== undefined) {
      sets.push("name = :name");
      params.name = patch.name;
    }
    if (patch.email !== undefined) {
      sets.push("email = :email");
      params.email = patch.email;
    }
    if (patch.active !== undefined) {
      sets.push("active = :active");
      params.active = patch.active ? 1 : 0;
    }
    if (sets.length)
      await query(`UPDATE users SET ${sets.join(", ")} WHERE id = :id`, params);
  }
  if (patch.roles && Array.isArray(patch.roles)) {
    await dbSetUserRoles(id, patch.roles);
  } else if (patch.role) {
    // backward compat: single role update
    await dbSetUserRoles(id, [patch.role]);
  }
  return dbFindUserById(id);
}

export async function dbUpdateUserPassword(
  id: string,
  password_hash: string
): Promise<void> {
  await query(
    `UPDATE users SET password_hash = :password_hash WHERE id = :id`,
    { id, password_hash }
  );
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  await query(`DELETE FROM user_roles WHERE user_id = :id`, { id });
  await query<any>(`DELETE FROM users WHERE id = :id`, { id });
  // mysql2 returns OkPacket in different way; treat as success if no error and attempt completed
  return true;
}

// RBAC helpers
export async function dbListRoles(): Promise<Role[]> {
  const rows = await query<{ name: string }>(
    `SELECT name FROM roles ORDER BY id ASC`
  );
  return rows.map((r) => r.name as Role);
}

export async function dbSetUserRoles(
  userId: string,
  roles: Role[]
): Promise<void> {
  await query(`DELETE FROM user_roles WHERE user_id = :userId`, { userId });
  if (!roles.length) return;
  // insert each role mapping
  for (const role of roles) {
    const roleId = await getRoleIdByName(role);
    if (roleId) {
      await query(
        `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)`,
        { userId, roleId }
      );
    }
  }
  // Invalidate cached permissions in sessions for this user so active sessions
  // will refresh permissions on next request.
  try {
    await query(
      `UPDATE sessions SET permissions = NULL WHERE user_id = :userId`,
      { userId }
    );
  } catch (e) {
    // Best-effort: log the error so it's not silently ignored.
    // This satisfies linters that require handling caught exceptions.
    console.warn("dbSetUserRoles: failed to invalidate session permissions cache for user", userId, e);
  }
}

export async function dbListPermissions(): Promise<string[]> {
  const rows = await query<{ name: string }>(
    `SELECT name FROM permissions ORDER BY id ASC`
  );
  return rows.map((r) => r.name);
}

export async function dbGetRolePermissions(role: Role): Promise<string[]> {
  const rows = await query<{ name: string }>(
    `SELECT p.name
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE r.name = :role
      ORDER BY p.id ASC`,
    { role }
  );
  return rows.map((r) => r.name);
}

export async function dbSetRolePermissions(
  role: Role,
  permissions: string[]
): Promise<void> {
  const roleId = await getRoleIdByName(role);
  if (!roleId) return;
  await query(`DELETE FROM role_permissions WHERE role_id = :roleId`, {
    roleId,
  });
  if (!permissions.length) return;
  // Insert new mappings
  for (const perm of permissions) {
    const rows = await query<{ id: number }>(
      `SELECT id FROM permissions WHERE name = :name LIMIT 1`,
      { name: perm }
    );
    const permId = rows[0]?.id;
    if (permId) {
      await query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permId)`,
        { roleId, permId }
      );
    }
  }
}

// Aggregate permissions for a user via roles
export async function dbGetUserPermissions(userId: string): Promise<string[]> {
  const rows = await query<{ name: string }>(
    `SELECT DISTINCT p.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = :userId
      ORDER BY p.name ASC`,
    { userId }
  );
  return rows.map((r) => r.name);
}
