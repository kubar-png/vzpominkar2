import type { Metadata } from "next";
import { FeedbackFlow } from "./feedback-flow";

/* ─────────────────────────────────────────────────────────────────────────
 * /testovani/nazor — Typeform-style tester feedback survey.
 *
 * Server wrapper only: sets metadata (noindex — testers get the link directly)
 * and renders the client flow. Not auth-gated; the survey works signed-in or
 * anonymously (submitFeedback attributes the owner when a session exists).
 * ─────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Váš názor na Vzpomínkář",
  description:
    "Pár otázek pro testery Vzpomínkáře. Vaše zpětná vazba nám pomůže dotáhnout aplikaci i tištěnou knihu.",
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return <FeedbackFlow />;
}
