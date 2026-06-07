import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyAdminCredentials } from "@/lib/admin/auth";

const USERNAME = "admin-operator";
const PASSWORD = "S3cret-Passw0rd!";

let prevUser: string | undefined;
let prevPass: string | undefined;

beforeEach(() => {
  prevUser = process.env.ADMIN_USERNAME;
  prevPass = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_USERNAME = USERNAME;
  process.env.ADMIN_PASSWORD = PASSWORD;
});

afterEach(() => {
  if (prevUser === undefined) delete process.env.ADMIN_USERNAME;
  else process.env.ADMIN_USERNAME = prevUser;
  if (prevPass === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = prevPass;
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

  it("rejects a near-miss username (no length leak)", () => {
    expect(verifyAdminCredentials(USERNAME + "x", PASSWORD)).toBe(false);
    expect(verifyAdminCredentials(USERNAME.slice(0, -1), PASSWORD)).toBe(false);
  });

  it("rejects a near-miss password (no length leak)", () => {
    expect(verifyAdminCredentials(USERNAME, PASSWORD + "x")).toBe(false);
    expect(verifyAdminCredentials(USERNAME, PASSWORD.slice(0, -1))).toBe(false);
  });

  it("rejects empty credentials", () => {
    expect(verifyAdminCredentials("", "")).toBe(false);
    expect(verifyAdminCredentials(USERNAME, "")).toBe(false);
    expect(verifyAdminCredentials("", PASSWORD)).toBe(false);
  });

  it("fails closed when the password env is missing", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
  });

  it("fails closed when the username env is missing", () => {
    delete process.env.ADMIN_USERNAME;
    expect(verifyAdminCredentials(USERNAME, PASSWORD)).toBe(false);
  });

  it("fails closed when both envs are empty strings", () => {
    process.env.ADMIN_USERNAME = "";
    process.env.ADMIN_PASSWORD = "";
    expect(verifyAdminCredentials("", "")).toBe(false);
  });
});
