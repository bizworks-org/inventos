#!/usr/bin/env node
import { scryptSync, randomBytes } from 'node:crypto';

function hash(password, N = 16384) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64, { N });
  return `scrypt$${N}$${salt}$${derived.toString('hex')}`;
}

const [, , password, nArg] = process.argv;
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <password> [workFactor]');
  process.exit(1);
}
const N = nArg ? parseInt(nArg, 10) : 16384;
console.log(hash(password, N));
