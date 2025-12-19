import fs from "node:fs";
import path from "node:path";
import util from "node:util";

type Meta = Record<string, any> | string | undefined;

const LOG_DIR = path.join(process.cwd(), "logs");
const INFO_LOG = path.join(LOG_DIR, "info.log");
const ERROR_LOG = path.join(LOG_DIR, "error.log");
const AUTH_LOG = path.join(LOG_DIR, "auth.log");

let useVercelBlob = false;

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    useVercelBlob = false;
  } catch (err) {
    // If we can't create the logs directory (e.g., on Vercel), fall back to Vercel Blob
    console.warn("Could not create logs directory, will use Vercel Blob", err);
    useVercelBlob = true;
  }
}

ensureLogDir();

let infoStream: fs.WriteStream | null = null;
let errorStream: fs.WriteStream | null = null;
let authStream: fs.WriteStream | null = null;

if (!useVercelBlob) {
  infoStream = fs.createWriteStream(INFO_LOG, { flags: "a" });
  errorStream = fs.createWriteStream(ERROR_LOG, { flags: "a" });
  authStream = fs.createWriteStream(AUTH_LOG, { flags: "a" });
}
function safeStringify(obj: Meta) {
  if (obj === undefined) return "";
  if (typeof obj === "string") return obj;
  try {
    return JSON.stringify(obj);
  } catch {
    try {
      // Use util.inspect to produce a readable representation for objects
      // instead of Object's default "[object Object]" string.
      return util.inspect(obj, { depth: null, compact: false });
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

async function writeToVercelBlob(logType: string, line: string) {
  try {
    const { put } = await import("@vercel/blob");
    const key = `logs/${logType}.log`;
    // Read existing content, append new line
    try {
      const response = await fetch(
        `${process.env.BLOB_READ_WRITE_TOKEN ? "https://blob.vercel-storage.com" : ""}/logs/${logType}.log`,
        {
          headers: {
            authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        }
      );
      if (response.ok) {
        const existing = await response.text();
        await put(key, existing + line, {
          access: "public",
          addRandomSuffix: false,
        });
      } else {
        await put(key, line, { access: "public", addRandomSuffix: false });
      }
    } catch {
      // If read fails, just write the new line
      await put(key, line, { access: "public", addRandomSuffix: false });
    }
  } catch (err) {
    // Silently fail if Vercel Blob is not available
  }
}

const logger = {
  info(msg: unknown, meta?: Meta) {
    const line = formatLine("INFO", msg, meta);
    try {
      if (useVercelBlob) {
        writeToVercelBlob("info", line).catch(() => {});
      } else if (infoStream) {
        infoStream.write(line);
      }
    } catch {}
    return true;
  },
  warn(msg: unknown, meta?: Meta) {
    const line = formatLine("WARN", msg, meta);
    try {
      if (useVercelBlob) {
        writeToVercelBlob("info", line).catch(() => {});
      } else if (infoStream) {
        infoStream.write(line);
      }
    } catch {}
    return true;
  },
  error(msg: unknown, meta?: Meta) {
    const line = formatLine("ERROR", msg, meta);
    try {
      if (useVercelBlob) {
        writeToVercelBlob("error", line).catch(() => {});
      } else if (errorStream) {
        errorStream.write(line);
      }
    } catch {}
    return true;
  },
  auth(msg: unknown, meta?: Meta) {
    const line = formatLine("AUTH", msg, meta);
    try {
      if (useVercelBlob) {
        writeToVercelBlob("auth", line).catch(() => {});
      } else if (authStream) {
        authStream.write(line);
      }
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
