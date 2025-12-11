import fs from "node:fs";
import path from "node:path";

type Meta = Record<string, any> | string | undefined;

const LOG_DIR = path.join(process.cwd(), "logs");
const INFO_LOG = path.join(LOG_DIR, "info.log");
const ERROR_LOG = path.join(LOG_DIR, "error.log");
const AUTH_LOG = path.join(LOG_DIR, "auth.log");

function ensureLogDir() {
  // Create the log directory; let errors surface so unexpected failures are not silently ignored.
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

ensureLogDir();

const infoStream = fs.createWriteStream(INFO_LOG, { flags: "a" });
const errorStream = fs.createWriteStream(ERROR_LOG, { flags: "a" });
const authStream = fs.createWriteStream(AUTH_LOG, { flags: "a" });

function safeStringify(obj: Meta) {
  if (obj === undefined) return "";
  if (typeof obj === "string") return obj;
  try {
    return JSON.stringify(obj);
  } catch {
    try {
      return String(obj);
    } catch {
      return "";
    }
  }
}

function formatLine(level: string, msg: unknown, meta?: Meta) {
  const ts = new Date().toISOString();
  const message = typeof msg === "string" ? msg : safeStringify(msg);
  const m = meta ? ` ${safeStringify(meta)}` : "";
  return `${ts} [${level}] ${message}${m}\n`;
}

const logger = {
  info(msg: unknown, meta?: Meta) {
    try {
      infoStream.write(formatLine("INFO", msg, meta));
    } catch {}
    return true;
  },
  warn(msg: unknown, meta?: Meta) {
    try {
      infoStream.write(formatLine("WARN", msg, meta));
    } catch {}
    return true;
  },
  error(msg: unknown, meta?: Meta) {
    try {
      errorStream.write(formatLine("ERROR", msg, meta));
    } catch {}
    return true;
  },
  auth(msg: unknown, meta?: Meta) {
    try {
      authStream.write(formatLine("AUTH", msg, meta));
    } catch {}
    return true;
  },
};

// Monkey-patch console so existing console.log/warn/error go to files as well
// This is best-effort and only applied once per process when this module is loaded.
try {
  const _log = console.log.bind(console);
  const _warn = console.warn.bind(console);
  const _error = console.error.bind(console);

  console.log = (...args: any[]) => {
    try {
      logger.info(
        args
          .map((a) => (typeof a === "string" ? a : safeStringify(a)))
          .join(" ")
      );
    } catch {}
    _log(...args);
  };
  console.info = console.log;

  console.warn = (...args: any[]) => {
    try {
      logger.warn(
        args
          .map((a) => (typeof a === "string" ? a : safeStringify(a)))
          .join(" ")
      );
    } catch {}
    _warn(...args);
  };

  console.error = (...args: any[]) => {
    try {
      logger.error(
        args
          .map((a) => (typeof a === "string" ? a : safeStringify(a)))
          .join(" ")
      );
    } catch {}
    _error(...args);
  };
} catch {}

export default logger;
