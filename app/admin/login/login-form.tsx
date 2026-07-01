"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminActionResult } from "@/lib/admin/actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(
    loginAdmin,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
          Uživatelské jméno
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-[#1B2E4D] focus:ring-1 focus:ring-[#1B2E4D]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          Heslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-[#1B2E4D] focus:ring-1 focus:ring-[#1B2E4D]"
        />
      </div>

      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[#CF364C] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#C33D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2E4D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Přihlašuji…" : "Přihlásit se"}
      </button>
    </form>
  );
}
