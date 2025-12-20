import mysql from "mysql2/promise";
import { loadDbConfigSync } from "./configStore";
import logger from "./logger";

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
      port: Number.parseInt(MYSQL_PORT, 10),
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
  for (let attempts = 1; attempts <= 2; attempts++) {
    try {
      const [rows] = await getPool().query(sql, params);
      return rows as T[];
    } catch (err: any) {
      const code = err?.code;
      const retryable = err?.fatal || code === "ECONNRESET" || code === "PROTOCOL_CONNECTION_LOST";
      logger.error({ note: "DB query error", attempt: attempts, code: code || err?.message || err });
      if (!retryable || attempts === 2) {
        throw err;
      }
      try {
        __resetPool();
      } catch {}
      await new Promise((res) => setTimeout(res, 250));
    }
  }
  throw new Error("Unreachable");
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
