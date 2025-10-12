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
