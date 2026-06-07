import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { scryptSync, randomBytes } from "node:crypto";
import { verifyAdminCredentials } from "@/lib/admin/auth";

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

/** Build an ADMIN_PASSWORD_HASH the same way scripts/hash-admin-password.mjs does. */
function makeHash(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const USERNAME = "admin-operator";
const PASSWORD = "S3cret-Passw0rd!";

let prevUser: string | undefined;
let prevHash: string | undefined;

beforeEach(() => {
  prevUser = process.env.ADMIN_USERNAME;
  prevHash = process.env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_USERNAME = USERNAME;
  process.env.ADMIN_PASSWORD_HASH = makeHash(PASSWORD);
});

afterEach(() => {
  if (prevUser === undefined) delete process.env.ADMIN_USERNAME;
  else process.env.ADMIN_USERNAME = prevUser;
  if (prevHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
  else process.env.ADMIN_PASSWORD_HASH = prevHash;
});

describe("verifyAdminCredentials", () => {
  it("accepts the correct username + password", () => {
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(true);
  });

  it("rejects the wrong password", () => {
    expect(verifyAdminCredentials(USERNAME, "wrong-password")).toBe(false);
  });

  it("rejects the wrong username", () => {
    expect(verifyAdminCredentials("someone-else", PASSWORD)).toBe(false);
  });

  it("rejects a correct password with a near-miss username (no length leak)", () => {
    expect(verifyAdminCredentials(USERNAME + "x", PASSWORD)).toBe(false);
    expect(verifyAdminCredentials(USERNAME.slice(0, -1), PASSWORD)).toBe(false);
  });

  it("rejects empty credentials", () => {
    expect(verifyAdminCredentials("", "")).toBe(false);
    expect(verifyAdminCredentials(USERNAME, "")).toBe(false);
    expect(verifyAdminCredentials("", PASSWORD)).toBe(false);
  });

  it("fails closed when the hash env is missing", () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
  });

  it("fails closed when the username env is missing", () => {
    delete process.env.ADMIN_USERNAME;
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
  });

  it("fails closed on a malformed hash (wrong scheme / segment count)", () => {
    process.env.ADMIN_PASSWORD_HASH = "bcrypt$16384$8$1$aabb$ccdd";
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
    process.env.ADMIN_PASSWORD_HASH = "scrypt$16384$8$deadbeef";
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
    process.env.ADMIN_PASSWORD_HASH = "not-a-hash";
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
  });

  it("honors the params stored in the hash string", () => {
    // Re-derive against the same stored hash to confirm parsing of N/r/p/salt.
    const stored = process.env.ADMIN_PASSWORD_HASH!;
    const [, nStr, rStr, pStr, saltHex, hashHex] = stored.split("$");
    const derived = scryptSync(PASSWORD, Buffer.from(saltHex!, "hex"), KEYLEN, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    });
    expect(derived.toString("hex")).toBe(hashHex);
  });
});
