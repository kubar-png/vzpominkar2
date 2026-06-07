"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password input with a show/hide eye toggle. Drop-in for the auth forms: it
 * renders the same `.auth-field input` (styling inherited) inside a relative
 * wrapper with the eye button anchored right. The `type` is owned here (toggles
 * password ⇄ text), so any incoming `type` is ignored. All other input props
 * (id, name, autoComplete, required, minLength, aria-*, style…) pass through.
 */
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput(props: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-password-wrap">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Skrýt heslo" : "Zobrazit heslo"}
        aria-pressed={show}
        title={show ? "Skrýt heslo" : "Zobrazit heslo"}
      >
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
