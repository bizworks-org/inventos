#!/usr/bin/env node
import mysql from 'mysql2/promise';
import { scryptSync, randomBytes } from 'node:crypto';

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  let pwd = '';
  const pick = (set) => set[Math.floor(Math.random() * set.length)];
  pwd += pick('abcdefghijklmnopqrstuvwxyz');
  pwd += pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  pwd += pick('0123456789');
  while (pwd.length < length) pwd += pick(chars);
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

function hash(password, N = 16384) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64, { N });
  return `scrypt$${N}$${salt}$${derived.toString('hex')}`;
}

const [, , emailArg, passwordArg] = process.argv;
const email = emailArg || 'vaseems@ai.com';
const password = passwordArg || generatePassword(12);

const MYSQL_HOST = 'srv1264.hstgr.io';
const MYSQL_PORT = Number.parseInt('3306', 10);
const MYSQL_USER = 'u468634218_inventos';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = 'u468634218_inventos';

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  namedPlaceholders: true,
  connectionLimit: 1,
});

// Ensure the script runs reliably when executed with `node` on Windows.
// Print a small debug line early so failures are visible in shells.
console.log('reset-admin-password: starting');

try {
  const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    console.error(`User with email ${email} not found in database ${MYSQL_DATABASE} on ${MYSQL_HOST}:${MYSQL_PORT}`);
    console.error('You can create the user manually or run the dev seed endpoint if available.');
    process.exit(2);
  }
  const user = Array.isArray(rows) ? rows[0] : rows;
  const password_hash = hash(password);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user.id]);

  // Verify
  const [checkRows] = await pool.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [user.id]);
  const stored = Array.isArray(checkRows) ? checkRows[0]?.password_hash : checkRows?.password_hash;
  if (!stored) {
    console.error('Failed to read back stored password hash after update.');
    process.exit(3);
  }
  // simple sanity: check format starts with scrypt$
  if (!stored.startsWith('scrypt$')) {
    console.error('Stored password hash does not appear to be scrypt format:', stored.slice(0, 60));
    process.exit(4);
  }

  console.log('Password reset successful.');
  console.log('Email:', email);
  console.log('New password:', password);
  console.log('You can now log in with the above credentials.');
} catch (err) {
  console.error('Error resetting password:', err?.message || err);
  process.exit(1);
} finally {
  try { await pool.end(); } catch {}
}
