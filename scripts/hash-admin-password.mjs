#!/usr/bin/env node
/**
 * Generate the env values for the internal admin login.
 *
 *   node scripts/hash-admin-password.mjs <password>
 *
 * Prints:
 *   - ADMIN_PASSWORD_HASH  (scrypt$N$r$p$saltHex$hashHex) to paste into Vercel.
 *   - A suggested ADMIN_SESSION_SECRET (32 random bytes, hex) — equivalent to
 *     `openssl rand -hex 32`.
 *
 * Set ADMIN_USERNAME yourself. These three vars live ONLY in Vercel env, never
 * in the database. Params here MUST match lib/admin/auth.ts.
 */
import { scryptSync, randomBytes } from "node:crypto";

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-admin-password.mjs <password>");
  process.exit(1);
}

const salt = randomBytes(SALT_BYTES);
const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
const passwordHash = `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
const sessionSecret = randomBytes(32).toString("hex");

console.log("");
console.log("Paste these into Vercel → Project → Environment Variables");
console.log("(Production + Preview). Also set ADMIN_USERNAME yourself.");
console.log("");
console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
console.log("");
console.log(`# Suggested (generate once, then keep stable):`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log("");
