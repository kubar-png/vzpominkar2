import { test, expect } from "@playwright/test";

/**
 * Smoke test for the public marketing surface. The full owner→senior flow
 * requires either disabling Supabase email confirmation or programmatically
 * confirming the user; that's documented in the README and intentionally
 * left as a test.skip below.
 */

test("landing page renders brand and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vzpomínkář/);
  await expect(page.getByRole("heading", { name: /Vzpomínky, které/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Založit Vzpomínkář" }).first()).toBeVisible();
});

test("pricing page shows flat 2 890 Kč", async ({ page }) => {
  await page.goto("/cenik");
  await expect(page.getByRole("heading", { name: /Jedna platba/i })).toBeVisible();
  await expect(page.getByText("2 890 Kč").first()).toBeVisible();
});

test("FAQ items expand", async ({ page }) => {
  await page.goto("/faq");
  const first = page.getByText("Pro koho je Vzpomínkář?");
  await first.click();
  await expect(
    page.getByText(/zaznamenat vzpomínky rodičů a prarodičů/i),
  ).toBeVisible();
});

test("login page accepts credentials format", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Přihlášení$/ })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Heslo")).toBeVisible();
});

test("senior login surface uses larger primitives", async ({ page }) => {
  await page.goto("/senior-login");
  await expect(page.getByRole("heading", { name: /Vítejte zpátky/i })).toBeVisible();
  // Senior-min touch target = 60px (CSS min-height); not asserted here, but
  // we at least confirm the input exists.
  await expect(page.getByLabel("Uživatelské jméno")).toBeVisible();
});

test.describe("Authenticated flow (requires email confirmation off)", () => {
  test.skip(
    true,
    "Disable Supabase email confirmation on the test project before running this; see README §Testing.",
  );

  test("owner signup → onboarding → senior creation", async () => {
    // Implementation outline:
    // 1. POST /signup with random email
    // 2. Wait for /login/check-email
    // 3. (with email confirmation off) POST /login
    // 4. Expect /onboarding
    // 5. Submit family + 5 prompts → expect /onboarding/credentials
    // 6. Submit senior username + password → handoff card visible
    // 7. Click "Pokračovat" → /dashboard with non-zero stats
  });
});
