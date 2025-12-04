#!/usr/bin/env node
import mysql from 'mysql2/promise';

const [, , emailArg] = process.argv;
const email = emailArg || 'admin@inventos.io';

const MYSQL_HOST = 'srv1264.hstgr.io';
const MYSQL_PORT = Number.parseInt('3306', 10);
const MYSQL_USER = 'u468634218_inventos';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = 'u468634218_inventos';

if (!MYSQL_PASSWORD) {
  console.error('Missing MYSQL_PASSWORD environment variable.');
  process.exit(1);
}

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  namedPlaceholders: true,
  connectionLimit: 1,
});

try {
  const [rows] = await pool.query('SELECT id, email, name, active, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows || rows.length === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(2);
  }
  const u = rows[0];
  // Mask the hash partly
  let hash = null;
  if (u.password_hash) {
    if (u.password_hash.length > 40) {
      hash = u.password_hash.slice(0, 40) + '...';
    } else {
      hash = u.password_hash;
    }
  }
  console.log(JSON.stringify({ id: u.id, email: u.email, name: u.name, active: u.active, password_hash_preview: hash }, null, 2));
} catch (err) {
  console.error('Error querying DB:', err?.message || err);
  process.exit(1);
} finally {
  try { await pool.end(); } catch {}
}

// Run main unconditionally when the script is executed with `node`.
main();
// Run unconditionally when the script is executed with `node` using top-level await.
