import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { encryptJson, decryptJson } from './crypto';

export type DbPayload = {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
};

const storeDir = path.join(process.cwd(), '.data');
const dbFile = path.join(storeDir, 'db.enc.json');
const mailFile = path.join(storeDir, 'smtp.enc.json');

export type MailPayload = {
  host: string;
  port?: number; // default 587
  secure?: boolean; // true for 465, false for others
  user?: string;
  password?: string;
  fromName?: string;
  fromEmail: string;
};

export async function saveDbConfig(cfg: DbPayload): Promise<void> {
  // Ensure dir
  await fs.mkdir(storeDir, { recursive: true });
  const blob = encryptJson(cfg);
  await fs.writeFile(dbFile, JSON.stringify(blob), 'utf8');
}

export async function loadDbConfig(): Promise<DbPayload | null> {
  try {
    const raw = await fs.readFile(dbFile, 'utf8');
    const bundle = JSON.parse(raw) as { iv: string; tag: string; cipher: string };
    return decryptJson<DbPayload>(bundle);
  } catch {
    return null;
  }
}

export function getDbConfigPath(): string { return dbFile; }

export function loadDbConfigSync(): DbPayload | null {
  try {
    const raw = fsSync.readFileSync(dbFile, 'utf8');
    const bundle = JSON.parse(raw) as { iv: string; tag: string; cipher: string };
    return decryptJson<DbPayload>(bundle);
  } catch {
    return null;
  }
}

export async function saveMailConfig(cfg: MailPayload): Promise<void> {
  await fs.mkdir(storeDir, { recursive: true });
  const blob = encryptJson(cfg);
  await fs.writeFile(mailFile, JSON.stringify(blob), 'utf8');
}

export async function loadMailConfig(): Promise<MailPayload | null> {
  try {
    const raw = await fs.readFile(mailFile, 'utf8');
    const bundle = JSON.parse(raw) as { iv: string; tag: string; cipher: string };
    return decryptJson<MailPayload>(bundle);
  } catch {
    return null;
  }
}

export function getMailConfigPath(): string { return mailFile; }

export function loadMailConfigSync(): MailPayload | null {
  try {
    const raw = fsSync.readFileSync(mailFile, 'utf8');
    const bundle = JSON.parse(raw) as { iv: string; tag: string; cipher: string };
    return decryptJson<MailPayload>(bundle);
  } catch {
    return null;
  }
}
