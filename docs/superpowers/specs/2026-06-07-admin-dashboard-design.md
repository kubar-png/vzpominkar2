# Admin dashboard — design spec

**Date:** 2026-06-07
**Route:** `/admin` · **Branch:** `feat/admin-dashboard`
**Goal:** A single-operator internal dashboard with business stats, behind an auth that is fully separate from user/Supabase auth and stored outside the app database. Clean, dense, Vercel-like UI (not the brand editorial style). Functionality over aesthetics.

## Decisions (owner, 2026-06-07)
- Login = **username + password**, session **12 h**.
- **No IP allowlist.**
- **Full metric set** (below).
- Charts via **recharts** (new dependency).
- UI may drop the brand editorial style — neutral/monochrome, very readable.

---

## 1. Auth — env-based single credential, signed session cookie

**No database involvement.** Credentials live only in Vercel ENV (encrypted at rest), never in `profiles`/`auth.users`. No signup, no password reset, no account creation — the credential changes only by editing the ENV var.

**ENV (operator sets in Vercel, all environments):**
- `ADMIN_USERNAME` — the admin username (plaintext is fine; it's a second factor of obscurity).
- `ADMIN_PASSWORD` — the admin password, PLAINTEXT (env only, for operator simplicity — no hashing step; owner decision 2026-06-07). Use a password not reused elsewhere, since an env leak would expose it as-is. Verified constant-time.
- `ADMIN_SESSION_SECRET` — random 32-byte hex; HMAC key for signing the session cookie.

**`lib/admin/auth.ts`** (`"server-only"`):
- `verifyAdminCredentials(username, password)` — constant-time compare username; derive scrypt with the stored salt/params; `crypto.timingSafeEqual` the derived key vs stored hash. Returns boolean. Uses Node `node:crypto` (runs only in the server action → Node runtime).
- Cookie constants: `ADMIN_COOKIE = "vzp_admin"`, `ADMIN_SESSION_MAX_AGE = 12 * 60 * 60`.

**`lib/admin/session.ts`** (`"server-only"`, **Web Crypto** so middleware can verify):
- `signAdminSession(): Promise<string>` — payload `{ exp: nowSec + MAX_AGE }`, token = `base64url(JSON)` + `"."` + base64url(HMAC-SHA256(payload, ADMIN_SESSION_SECRET)) via `crypto.subtle`.
- `verifyAdminSession(token): Promise<boolean>` — recompute HMAC, constant-time compare, check `exp > now`. Pure Web Crypto (works in middleware AND server).

**`lib/admin/actions.ts`** (`"use server"`):
- `loginAdmin(prev, formData)` — rate-limited (`checkRateLimit("admin", "login")`, see below; fail-CLOSED in prod), verify credentials, on success set the signed cookie (httpOnly, secure in prod, sameSite=strict, path=`/admin`, maxAge MAX_AGE) and redirect to `/admin`. Generic error on failure (no "user vs password" leak).
- `logoutAdmin()` — clear the cookie, redirect to `/admin/login`.

**Rate limit:** add an `"admin"` kind to `lib/rate-limit.ts` (limit ~5 / 15 min per IP), reusing `authFailDecision` (fail-closed in prod). Also add a per-username admin throttle mirroring `checkSeniorUsernameLimit`.

**Middleware guard (`middleware.ts`):**
- Add `"/admin/:path*"` to the matcher.
- At the **top** of `middleware()`, BEFORE the Supabase client is created: `if (pathname.startsWith("/admin"))` → handle admin separately and `return` (never touch Supabase for /admin):
  - Allow `/admin/login` through (the login page + action).
  - Else read the `vzp_admin` cookie, `await verifyAdminSession(token)`; if invalid → `NextResponse.redirect("/admin/login")`.
- This keeps admin auth 100% independent of the user session.

**Routes/pages:**
- `app/admin/login/page.tsx` + `login-form.tsx` — minimal centered login (username + password), neutral style, uses `loginAdmin`. No links to signup/reset (they don't exist).
- `app/admin/layout.tsx` — server layout; double-checks `verifyAdminSession` (defense in depth) and renders the admin chrome (header with the period toggle + a logout button). Its own neutral styling scope.

**Operator tooling:** `scripts/hash-admin-password.mjs` — `node scripts/hash-admin-password.mjs <password>` prints the `ADMIN_PASSWORD_HASH` value to paste into Vercel, plus a freshly generated `ADMIN_SESSION_SECRET` suggestion (`openssl rand -hex 32` equivalent).

---

## 2. Stats data layer — `lib/admin/stats.ts` (`"server-only"`)

All reads via `createAdminClient()` (service role, bypasses RLS). Parameterized by a **period**: `"day" | "week" | "month" | "year"` → a rolling window (last 24h / 7d / 30d / 365d). Each metric returns: **value for the current window**, **value for the previous equal window** (for a delta %), and where useful a **time-series** for the chart (bucketed: hourly for day, daily for week/month, monthly for year).

Verify exact column names against `types/database.ts`. Known shapes:
- **Obrat celkem (CZK):** sum of `books.amount_czk` where `paid` (ts `paid_at`) + `shop_orders.amount_czk` where `status='paid'` (ts `paid_at`) + `book_orders.amount_czk` where `status='paid'` (ts: `book_orders` has no `paid_at` → use `created_at`).
- **Prodané přístupy ke knize:** count `books` where `paid=true` (ts `paid_at`). (First paid book per family = the 2890 base sale.)
- **Prodané dárkové knihy:** count `shop_orders` where `status='paid'` (ts `paid_at`).
- **Doobjednané výtisky:** count `book_orders` where `status='paid'` (ts `created_at`).
- **Uplatněné kupóny:** count `coupon_redemptions` (ts `redeemed_at`) + sum `amount_off_czk` (sleva celkem).
- **Rodiny (owners):** count `profiles` where `role='owner'` (ts `created_at`); also total all-time.
- **Senioři:** count `profiles` where `role='senior'`.
- **Aktivní předplatná:** count `families` where `subscription_status='active'` (point-in-time, no delta needed; show current total).
- **Vzpomínky:** count `memories` (ts `created_at`), with type breakdown — infer: `audio_path` not null → audio, else `text_content` not null → text, else photo.
- **Odpovězené otázky:** count `prompt_assignments` where `answered_memory_id` not null (ts: use `created_at` or the answered memory's ts — pick `created_at` for simplicity, note the approximation).
- **Leady:** count `leads` (ts `created_at`); plus how many with `marketing_consent=true` (consent rate).

Return a single typed `StatsBundle` object. Keep queries efficient (count: 'exact', head: true where only a count is needed; one ranged query per metric for current + previous window, or two head-counts). Batch where reasonable. This is small data — correctness and clarity over micro-optimization.

---

## 3. UI — `app/admin/page.tsx` + `app/admin/_components/*`

Server component reads `?period=` (default `week`), fetches `getStats(period)`, renders:
- **Header:** title + `PeriodToggle` (Den / Týden / Měsíc / Rok — links that set `?period=`), logout button.
- **Stat card grid:** `StatCard` = label, big value (CZK formatted via existing `formatCzk` where money), delta badge vs previous window (green ↑ / red ↓ / neutral), and for the headline metrics an inline **recharts** trend (Area/Bar) fed the time-series. Group into sections: *Obchod*, *Uživatelé*, *Aktivita*, *Trychtýř*.
- **Recent tables:** small `RecentTable`s — latest paid orders (books + gift) and latest leads — last ~10 rows.
- **Charts** (`_components/TrendChart.tsx`, `"use client"`): recharts ResponsiveContainer + Area/Bar/Line; neutral palette; data passed as serializable props from the server.

**Styling:** neutral/monochrome via Tailwind utility classes scoped to `/admin` — white/`zinc-50` background, white cards with `border border-zinc-200 rounded-lg`, `text-zinc-900`/`zinc-500`, one subtle accent for positive/negative deltas (emerald/red). System/sans font. **Do NOT import the editorial globals look**; do not edit the shared brand sections of `globals.css`. Dense, legible, Vercel-like.

---

## 4. File layout
```
middleware.ts                      (+ /admin early-guard branch, matcher entry)
lib/admin/auth.ts                  (constant-time credential verify, cookie consts)
lib/admin/session.ts               (Web Crypto sign/verify)
lib/admin/actions.ts               (loginAdmin, logoutAdmin)
lib/admin/stats.ts                 (getStats(period) → StatsBundle)
lib/rate-limit.ts                  (+ "admin" limiter + per-username admin throttle)
app/admin/layout.tsx               (guard + chrome, neutral style)
app/admin/page.tsx                 (dashboard)
app/admin/login/page.tsx
app/admin/login/login-form.tsx
app/admin/_components/StatCard.tsx
app/admin/_components/PeriodToggle.tsx
app/admin/_components/TrendChart.tsx ("use client", recharts)
app/admin/_components/RecentTable.tsx
tests/unit/admin-session.test.ts   (sign/verify: valid, tampered, expired)
tests/unit/admin-auth.test.ts      (credential verify: correct/incorrect, timing-safe)
```

## 5. Security checklist
- Credentials only in ENV; never logged, never returned to the client, never in the DB.
- Password kept plaintext in ENV (operator choice 2026-06-07); verified constant-time. Use a password not reused elsewhere. No hash needed.
- Session cookie signed (HMAC), httpOnly + secure + sameSite=strict + path=/admin + 12h exp; signature + exp checked on every request (middleware) and in the layout.
- Login rate-limited (per-IP + per-username), fail-closed in prod.
- No account creation / reset / signup surface anywhere.
- `/admin` never touches Supabase auth; stats read via service-role admin client (server-only).

## 6. Operator steps (after merge)
1. In Vercel → Project → Environment Variables (Production + Preview): set `ADMIN_USERNAME`, `ADMIN_PASSWORD` (your chosen password, plaintext), and `ADMIN_SESSION_SECRET` (`openssl rand -hex 32`).
2. Redeploy. Visit `/admin/login`.

## 7. Out of scope (later)
- Mutating app settings from the admin (this spec is read-only stats + auth). Settings-write comes next.
- Coupon management UI (create/expire) — schema exists; admin CRUD is a fast-follow.
- Calendar-period (vs rolling) toggle; export/CSV; multiple admins/roles.
