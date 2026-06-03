# Recipient Gender Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Implement task-by-task; commit per task; keep the dev server green.

**Goal:** Address the memoir subject in Czech with the correct grammatical gender (tykání) everywhere we speak to or about them — replacing the temporary "vyrůstal/a" slash fallback with real masculine/feminine rendering — while keeping a clean fallback when the gender is unknown.

**Architecture:** Store gender once on the person (`profiles.gender`, plus a per-order field for guest gift books that have no profile). Encode both forms in source strings with a `{masc|fem}` token. A single pure helper `resolveGender(text, gender)` renders masculine, feminine, or a "masc/diff-suffix" slash fallback for `null`. Every consumer of gendered copy calls the helper at render time.

**Tech Stack:** Next.js 15 App Router, TypeScript (strict + noUncheckedIndexedAccess), Supabase (Postgres + RLS), Zod, CSS Modules. No new deps.

---

## File Structure

- `lib/gender.ts` — **new.** `Gender` type, `resolveGender()`, `genderFromSeniorRole()`. The only place gender logic lives.
- `lib/book-shop/phases.ts` — **modify.** Replace each `…l/a` form with a `{masc|fem}` token.
- `components/book-pdf/BookDocument.tsx` — **modify.** Accept `gender?: Gender`; resolve `entry.question` tokens.
- `app/dev/book-preview/page.tsx` — **modify.** Add a gender toggle (Žena / Muž / Neuvedeno) to drive the preview.
- `app/kniha/sestavit/configurator.tsx` — **modify.** Resolve tokens at display + a recipient-gender choice that re-renders the questions and is saved with the draft/order.
- `supabase/migrations/<ts>_add_profile_gender.sql` — **new.** `profiles.gender` column + backfill from `senior_role`.
- `lib/validations/auth.ts` — **modify.** Add `gender` to the senior schema; expose `GENDER_OPTIONS`.
- `types/database.ts` — **modify.** Add `gender` to the `profiles` row/insert/update types.
- `app/(app)/family/[familyId]/rodina/add-senior-panel.tsx` + `senior-card.tsx` — **modify.** Capture/edit gender (default derived from role).
- `app/onboarding/onboarding-form.tsx` — **modify.** Optional gender at senior creation.
- `lib/email/templates.ts` — **modify.** Replace `přidal(a)` with a token resolved from the senior's gender.

---

## Phase A — Gender engine + book preview (reviewable on /dev/book-preview)

This is the slice the owner reviews first; it changes no DB or app forms.

### Task A1: The gender helper
**Files:** Create `lib/gender.ts`

- [ ] `Gender = "male" | "female"`.
- [ ] `resolveGender(text, gender)` — replace every `{masc|fem}` token: `male`→masc, `female`→fem, `null/undefined`→slash fallback (`{vyrůstal|vyrůstala}`→`vyrůstal/a`, `{hrdý|hrdá}`→`hrdý/á`).
- [ ] `genderFromSeniorRole(role)` — babicka/mama/prababicka/teta→female; dedecek/tata/pradedecek/stryc→male; else null.

### Task A2: Tokenize the book questions
**Files:** `lib/book-shop/phases.ts`

- [ ] Replace each `Xl/a` with `{Xl|Xla}` (e.g. `vyrůstal/a` → `{vyrůstal|vyrůstala}`). Neutral questions stay unchanged.
- [ ] Verify: no `/a` slash remains; token count matches the prior slash count (18).

### Task A3: Gender-aware renderer
**Files:** `components/book-pdf/BookDocument.tsx`

- [ ] Add `gender?: Gender` to props; render `resolveGender(entry.question, gender ?? null)`.
- [ ] Default (no prop) → `null` → slash fallback (current behaviour preserved).

### Task A4: Preview toggle
**Files:** `app/dev/book-preview/page.tsx`

- [ ] Toolbar: Žena / Muž / Neuvedeno → `female` / `male` / `null`; pass to `BookDocument`.

### Task A5: Don't break the configurator
**Files:** `app/kniha/sestavit/configurator.tsx`

- [ ] Resolve tokens (with `null` for now) wherever `q.text` is displayed/copied so no raw `{…}` shows.

**Checkpoint:** owner reviews on /dev/book-preview, then approves merge.

---

## Phase B — Capture gender on the person

### Task B1: Migration
**Files:** `supabase/migrations/<ts>_add_profile_gender.sql`
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IS NULL OR gender IN ('male','female'));
COMMENT ON COLUMN public.profiles.gender IS
  'Grammatical gender for Czech address (tykání). Owners may be null.';
UPDATE public.profiles SET gender = 'female'
  WHERE gender IS NULL AND senior_role IN ('babicka','mama','prababicka','teta');
UPDATE public.profiles SET gender = 'male'
  WHERE gender IS NULL AND senior_role IN ('dedecek','tata','pradedecek','stryc');
```
- [ ] Add column + backfill. (Applied to prod on deploy, with the rest of the deferred migrations.)

### Task B2: Types + validation
**Files:** `types/database.ts`, `lib/validations/auth.ts`
- [ ] Add `gender: string | null` to `profiles` Row/Insert/Update.
- [ ] `GENDER_OPTIONS = [{value:'female',label:'Žena'},{value:'male',label:'Muž'}]`; add optional `gender` to the senior Zod schema.

### Task B3: Capture in forms
**Files:** `add-senior-panel.tsx`, `senior-card.tsx`, `onboarding-form.tsx`
- [ ] Gender select after the role field; **default derived via `genderFromSeniorRole`** when the owner picks a role, still editable.
- [ ] Persist on create/edit.

---

## Phase C — Consume gender everywhere

### Task C1: App book + configurator
**Files:** `configurator.tsx`, the book-order path
- [ ] Configurator recipient-gender choice (žena/muž) stored with the draft + order; thread it into `resolveGender` and `BookDocument`.
- [ ] App-generated book passes the senior's `profiles.gender`.

### Task C2: Email
**Files:** `lib/email/templates.ts`
- [ ] Replace `přidal(a)` with `resolveGender("{přidal|přidala}", seniorGender)`; pass the senior's gender into the email input.

---

## Notes / decisions

- **App digital prompts (`supabase/seed.sql`) are formal (vykání) + already gender-neutral** — out of scope; no tokens needed there.
- **Marketing copy** (`app/page.tsx`, `app/darek/page.tsx`) uses mixed genders deliberately as examples — leave as-is.
- **`senior_role` already implies gender** for all values except "jine"; we use it only to *default* the explicit `gender` field (source of truth stays the new column).
- The `{masc|fem}` token degrades gracefully: any unconverted caller passing `null` still renders the familiar slash form, so partial rollout is safe.
