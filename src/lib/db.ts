import mysql from "mysql2/promise";
import { loadDbConfigSync } from "./configStore";

let pool: any = null;

export function getPool() {
  if (!pool) {
    // Attempt to hydrate env from secure config if present
    try {
      const cfg = loadDbConfigSync();
      if (cfg) {
        process.env.MYSQL_HOST = cfg.host;
        process.env.MYSQL_PORT = String(cfg.port ?? 3306);
        process.env.MYSQL_USER = cfg.user;
        process.env.MYSQL_PASSWORD = cfg.password ?? "";
        process.env.MYSQL_DATABASE = cfg.database;
      }
    } catch {}
    const {
      MYSQL_HOST = "localhost",
      MYSQL_PORT = "3306",
      MYSQL_USER = "root",
      MYSQL_PASSWORD = "",
      MYSQL_DATABASE = "inventos",
    } = process.env as Record<string, string>;

    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: parseInt(MYSQL_PORT, 10),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectionLimit: 10,
      namedPlaceholders: true,
      timezone: "Z",
      connectTimeout: 10000,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any): Promise<T[]> {
  // Robust query wrapper: retry once on transient connection errors and
  // recreate the pool if necessary. This helps when the DB closes idle
  // connections or there are brief network hiccups (ECONNRESET).
  let attempts = 0;
  while (true) {
    attempts += 1;
    try {
      const pool = getPool();
      const [rows] = await pool.query(sql, params);
      return rows as T[];
    } catch (err: any) {
      // If this was a transient connection error, attempt one reset+retry
      const retryable =
        err &&
        (err.code === "ECONNRESET" ||
          err.code === "PROTOCOL_CONNECTION_LOST" ||
          err.fatal);
      console.error(
        "DB query error (attempt",
        attempts,
        "):",
        err?.code || err?.message || err
      );
      if (attempts >= 2 || !retryable) {
        throw err;
      }
      // Reset pool and retry once
      try {
        if (pool) {
          try {
            await pool.end();
          } catch {}
        }
      } catch {}
      pool = null;
      // small delay before retrying
      await new Promise((res) => setTimeout(res, 250));
      continue;
    }
  }
}

// Allow runtime reset when DB config is updated via settings
export function __resetPool() {
  if (pool) {
    try {
      pool.end();
    } catch {}
  }
  pool = null;
}
