"use client";

import { useActionState } from "react";
import { MailWarning } from "lucide-react";
import { resendEmailVerification, type ActionResult } from "@/lib/auth/actions";

/**
 * "Ověřte svůj e-mail" banner shown to owners who signed up but haven't yet
 * clicked the verification link. Non-blocking during onboarding; the paywall
 * is where verification is actually enforced. The resend button calls the
 * server action (rate-limited / Supabase-throttled to ~60 s).
 */
export function VerifyEmailBanner({ email }: { email: string | null }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async () => resendEmailVerification(),
    null,
  );

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-gold-300)] bg-[var(--color-gold-50)] px-4 py-3 text-[var(--color-ink-900)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <MailWarning
          size={20}
          className="mt-0.5 shrink-0 text-[var(--color-gold-600)]"
          aria-hidden
        />
        <div className="text-sm leading-relaxed">
          <p className="font-medium">Ověřte svůj e-mail</p>
          <p className="text-[var(--color-text-muted)]">
            {state?.ok ? (
              <>Odkaz jsme znovu poslali{email ? ` na ${email}` : ""}. Mrkněte do schránky (i do spamu).</>
            ) : state?.ok === false ? (
              <span className="text-[var(--color-red-800)]">{state.error}</span>
            ) : (
              <>
                Poslali jsme vám ověřovací odkaz{email ? ` na ${email}` : ""}. Klikněte na něj,
                než aktivujete přístup ke knize.
              </>
            )}
          </p>
        </div>
      </div>

      <form action={formAction} className="shrink-0">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--color-gold-400)] bg-[var(--color-paper-50)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-900)] transition-colors hover:bg-[var(--color-gold-100)] disabled:opacity-60"
        >
          {pending ? "Posíláme…" : "Poslat znovu"}
        </button>
      </form>
    </div>
  );
}
