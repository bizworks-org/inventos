import { hashPassword, User } from './server';

// Simple in-memory user store for demo. In production, replace with DB.
const users: Record<string, User> = {};

function seed() {
  if (Object.keys(users).length) return;
  const admin: User = {
    id: 'u_admin',
    name: 'Admin User',
    email: 'admin@inventos.io',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    active: true,
  };
  const demo: User = {
    id: 'u_demo',
    name: 'Demo User',
    email: 'demo@inventos.io',
    role: 'user',
    passwordHash: hashPassword('demo123'),
    active: true,
  };
  users[admin.id] = admin;
  users[demo.id] = demo;
}

seed();

export function listUsers() {
  return Object.values(users);
}

export function findUserByEmail(email: string) {
  return Object.values(users).find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserById(id: string) {
  return users[id] || null;
}

export function createUser(input: Pick<User, 'name' | 'email' | 'role'> & { password: string }) {
  const id = `u_${Date.now().toString(36)}`;
  const user: User = {
    id,
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash: hashPassword(input.password),
    active: true,
  };
  users[id] = user;
  return user;
}

export function updateUser(id: string, patch: Partial<Omit<User, 'id'>>) {
  const curr = users[id];
  if (!curr) return null;
  users[id] = { ...curr, ...patch };
  return users[id];
}

export function deleteUser(id: string) {
  const curr = users[id];
  if (!curr) return false;
  delete users[id];
  return true;
}
