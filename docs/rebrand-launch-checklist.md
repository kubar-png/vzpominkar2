# First-user test — owner setup checklist

Rebrand is code-complete on the branch. These are the **things only you can do** (credentials, DNS, dashboards) to make the free, email-working test live on **vzpominkar.cz**. Register + login work even before email is wired.

## 1. Vercel — env vars (Production)
Set these in Vercel → Project → Settings → Environment Variables (Production), then redeploy:

**Free path (all zero → checkout grants access instantly, no Stripe):**
- `PRICE_BOOK_BASE_CZK=0`
- `PRICE_BOOK_ADDON_CZK=0`
- `PRICE_BOOK_PRINT_CZK=0`
- `PRICE_BOOK_PRINT_EXTRA_CZK=0`
- `PRICE_BOOK_COVER_PREMIUM_CZK=0`
- `PRICE_BOOK_GIFTWRAP_CZK=0`
- `PRICE_SHOP_BOOK_STANDARD_CZK=0`
- `PRICE_SHOP_BOOK_CUSTOM_CZK=0`
- `PRICE_YEARLY_ACCES_CZK=0`

**App URL + email identity** (app on **.cz**, mail sent from **.com**):
- `NEXT_PUBLIC_APP_URL=https://vzpominkar.cz`
- `EMAIL_FROM=Vzpomínkář <ahoj@vzpominkar.com>`
- `EMAIL_REPLY_TO=ahoj@vzpominkar.com`
- `RESEND_API_KEY` — ✓ provided (set locally; add same value in Vercel)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (recommended — otherwise auth rate-limiting is fail-open in prod)

> I can set the price/URL/email vars for you via the Vercel CLI — say the word.

## 2. Resend — verify sending domain
- Add & verify **vzpominkar.com** (the mailing domain for now) in Resend (SPF + DKIM DNS records).
- Until verified, external testers won't receive app mail (welcome/weekly/senior magic-link). Register/login still work without it.
- API key: ✓ already provided and wired.

## 3. Supabase — Auth settings (hosted dashboard)
- **Authentication → Providers → Email → "Confirm email" = OFF** (so signup returns a live session; testers land in /onboarding logged in).
- **Authentication → URL Configuration:** Site URL `https://vzpominkar.cz`; Redirect allow-list must include `https://vzpominkar.cz/auth/callback` and `https://vzpominkar.cz/auth/confirm`.
- **Custom SMTP (recommended):** point Supabase Auth SMTP at Resend so verification/password-reset emails actually deliver (built-in Supabase SMTP is ~3–4/hr, team-only).
- **Email templates → Confirm signup / Magic Link / Recovery:** set the action link to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
  so cross-device link opens work (elderly owners opening the link on a phone).

## 4. Smoke test (after deploy)
- Register at `/signup` → should land on `/onboarding` already logged in.
- Complete onboarding → `/dashboard` renders (free access granted).
- Sign out → sign in at `/login` → `/dashboard`.
- Senior: create senior in onboarding → log in at `/senior-login` (username/password) and/or open a `/q/{token}` magic link → `/home`.
- Confirm a verification email arrives (Supabase mailer / Resend) and the link confirms.
