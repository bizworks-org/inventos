import crypto from 'crypto';

const ALG = 'aes-256-gcm';
const IV_LEN = 12; // GCM recommended

function getKey(): Buffer {
  const secret = process.env.APP_CONFIG_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('Missing APP_CONFIG_SECRET (min 16 chars) for secure config encryption');
  }
  // Derive a 32-byte key using scrypt
  return crypto.scryptSync(secret, 'assetflow.salt', 32);
}

export function encryptJson(payload: unknown): { iv: string; tag: string; cipher: string } {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), tag: tag.toString('base64'), cipher: enc.toString('base64') };
}

export function decryptJson<T = any>(bundle: { iv: string; tag: string; cipher: string }): T {
  const key = getKey();
  const iv = Buffer.from(bundle.iv, 'base64');
  const tag = Buffer.from(bundle.tag, 'base64');
  const enc = Buffer.from(bundle.cipher, 'base64');
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString('utf8')) as T;
}
