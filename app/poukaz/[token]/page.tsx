import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/landing/Shell";
import { getVoucherByToken } from "@/lib/gift/voucher";
import { VoucherDownloadButton } from "@/components/gift/VoucherDownloadButton";

export const metadata: Metadata = {
  title: "Dárkový poukaz — Vzpomínkář",
  robots: { index: false },
};

// The voucher is live data gated on `paid` — never cache.
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────────────
 * /poukaz/[token] — public landing for the dárkový poukaz download.
 *
 * This is the link that goes in the confirmation e-mail (an e-mail can't POST
 * to the render API directly). The buyer clicks through here and downloads the
 * PDF from a real button. No login: the unguessable token + the paid gate on
 * the render route are the authorization (same model as the print pipeline).
 *
 * A token that doesn't exist OR isn't paid yet 404s — the PDF is a purchased
 * artifact, so we never hint that an unpaid/unknown voucher exists.
 * ───────────────────────────────────────────────────────────────────────── */

export default async function PoukazPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const voucher = await getVoucherByToken(decodeURIComponent(token));
  if (!voucher || !voucher.paid) notFound();

  return (
    <Shell stickyMobileCta={false}>
      <section className="hero" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div className="container" style={{ maxWidth: "620px" }}>
          <span className="eyebrow">Dárkový poukaz</span>
          <h1 style={{ maxWidth: "20ch", margin: "0 auto 20px" }}>Váš poukaz je připravený.</h1>
          <p className="lede">
            Stáhněte si dárkový poukaz jako PDF, vytiskněte ho a předejte. Vejde se na formát
            A5 na šířku.
          </p>
          <div style={{ marginTop: "28px" }}>
            <VoucherDownloadButton token={voucher.token} className="auth-submit" />
          </div>
        </div>
      </section>
    </Shell>
  );
}
