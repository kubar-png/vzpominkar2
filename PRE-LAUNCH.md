# PRE-LAUNCH — co dodělat před ostrým spuštěním

Živý seznam věcí, které **teď nejdou udělat** (typicky kvůli chybějící vlastní
doméně) nebo se mají udělat až těsně před spuštěním. Před launchem tímto
souborem projdeme a všechno odškrtneme. Nové blokované položky sem přibývají
průběžně.

> Stav projektu: web běží na **`vzpominkar2.vercel.app`** (Vercel), **vlastní
> doménu zatím nemáme**. Supabase projekt: `wgqpumxgvaamvpaguvdf`.

---

## 🚫 Blokováno chybějící doménou

### 1. Koupit a nasměrovat vlastní doménu
- [ ] Zaregistrovat doménu (zvažovaná: `vzpominkar.cz`).
- [ ] Nasměrovat na Vercel (A/CNAME záznamy), přidat doménu ve Vercel → projekt → Settings → Domains.
- **Tohle je kořenový blokátor** — odemkne body 2–4 níže.

### 2. Resend custom SMTP v Supabase (e-maily reálným uživatelům)
> Bez tohohle posílá maily vestavěné Supabase SMTP = **limit pár e-mailů/hodinu,
> často jen na členy projektu**. Reset hesla i ověřovací e-mail by reálným lidem
> nedorazily. Na testování s vlastním e-mailem to zatím stačí.
- [ ] V **Resendu → Domains → Add Domain** přidat vlastní doménu, vyplnit vypsané DNS záznamy (SPF/DKIM) u registrátora, počkat na ověření.
- [ ] V Supabase → **Authentication → Emails → SMTP Settings** → *Enable Custom SMTP*:
  - Host: `smtp.resend.com` · Port: `465` · Username: `resend`
  - Password: **Resend API key** (`RESEND_API_KEY` už v projektu je)
  - Sender: `noreply@<vlastní-doména>`
- Souvisí s: reset hesla (už nasazeno) + ověření e-mailu (feature „A").

### 3. Přepnout produkční URL z `vercel.app` na vlastní doménu
- [ ] **Vercel env** `NEXT_PUBLIC_APP_URL` → `https://<vlastní-doména>` (Settings → Environment Variables, Production).
- [ ] **Supabase → Authentication → URL Configuration** → Site URL + Redirect URLs (`/auth/callback`) na novou doménu.
- [ ] **Vercel env** `EMAIL_FROM` → adresa na nové doméně.
- [ ] Natvrdo zadané odkazy v kódu (projít a sjednotit na novou doménu):
  - `app/page.tsx` — org schema `url` + `logo` (`vzpominkar2.vercel.app`)
  - `app/layout.tsx` — `metadataBase` fallback
  - `app/sitemap.ts`, `app/robots.ts` — fallback `vzpominkar.cz`
  - `app/onboarding/credentials/credentials-form.tsx` — text `vzpominkar.cz/senior-login`
  - `app/(app)/family/[familyId]/rodina/add-senior-panel.tsx` a `.../senior/page.tsx` — fallback `vzpominkar.cz`
  - `lib/auth/actions.ts`, `app/api/cron/weekly-reminder/route.ts` — fallback `vzpominkar.cz`

### 4. Napojit Stripe (platby naostro)
> Odloženo, dokud nemáme doménu. Teď je „free path" (cena 0) → kniha se aktivuje
> okamžitě bez platby.
- [ ] Live klíče Stripe do Vercel env.
- [ ] Webhook endpoint na produkční doméně + ověření podpisu.
- [ ] Ověřit ceny: base 2000 Kč, add-on 1790 Kč, tisk dle nastavení.
- [ ] Embedded checkout (`ui_mode: 'embedded'`) ve vlastním UI místo přesměrování.

---

## ⚙️ Hardening / dashboard (nejde přes MCP, jen ručně)

### 5. Supabase — Leaked password protection
- [ ] Authentication → **zapnout ochranu prolomených hesel** (advisor L3). Nešlo přes MCP, jen v dashboardu.

### 6. Supabase — české šablony e-mailů (kosmetika)
- [ ] Authentication → Emails → Templates: přepsat **Magic Link** (použijeme jako „Ověřte svůj e-mail"), Confirm signup, Reset password do češtiny.

---

## ✅ Hotovo (kontext)
- Supabase „Confirm email" (zeď před onboardingem) **vypnuto** — vlastník se po registraci přihlásí hned. *(uděláno 2026-06-01)*
</content>
</invoke>
