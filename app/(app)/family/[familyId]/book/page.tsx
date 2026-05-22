import type { Metadata } from "next";
import Link from "next/link";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BookOrderForm } from "./book-form";

export const metadata: Metadata = { title: "Kniha" };

const BOOK_MIN = 30;

const STATUS_LABEL: Record<string, string> = {
  draft: "Rozepsaná",
  paid: "Zaplaceno",
  printing: "V tisku",
  shipped: "Odesláno",
  delivered: "Doručeno",
  cancelled: "Zrušeno",
};

const STATUS_TIMELINE: { key: string; label: string }[] = [
  { key: "paid", label: "Zaplaceno" },
  { key: "printing", label: "V tisku" },
  { key: "shipped", label: "Odesláno" },
  { key: "delivered", label: "Doručeno" },
];

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ ordered?: string }>;
}) {
  const { familyId } = await params;
  const sp = await searchParams;
  await requireOwnerOfFamily(familyId);

  const supabase = createAdminClient();

  const [{ count: memCount }, { data: orders }] = await Promise.all([
    supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("family_id", familyId)
      .eq("status", "published"),
    supabase
      .from("book_orders")
      .select("id, status, amount_czk, created_at")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .returns<{ id: string; status: string; amount_czk: number; created_at: string }[]>(),
  ]);

  const memories = memCount ?? 0;
  const ready = memories >= BOOK_MIN;
  const recentOrder = (orders ?? [])[0] ?? null;

  return (
    <div className="space-y-10">
      <AppPageHeader
        numeral="V"
        sectionLabel="Kniha"
        title="Tištěná kniha"
        description="Až bude vzpomínek dost, vytiskneme z nich knihu. Pošleme ji na vámi zadanou adresu."
        action={
          memories > 0 ? (
            <Link
              href={`/family/${familyId}/book/preview`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Náhled knihy →
            </Link>
          ) : null
        }
      />

      {sp.ordered ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--color-navy-200)] bg-[var(--color-navy-50)] p-3 text-sm"
        >
          Děkujeme - objednávku jsme přijali.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Připravenost</CardTitle>
          <CardDescription>
            {ready
              ? `Máte ${memories} vzpomínek - kniha je připravena k tisku.`
              : `Aktuálně máte ${memories}. Doporučujeme aspoň ${BOOK_MIN} - chybí ${BOOK_MIN - memories}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookStack value={memories} target={BOOK_MIN} />
        </CardContent>
      </Card>

      {recentOrder ? (
        <Card>
          <CardHeader>
            <CardTitle>Vaše poslední objednávka</CardTitle>
            <CardDescription>
              Vytvořena {new Date(recentOrder.created_at).toLocaleDateString("cs-CZ")} ·{" "}
              {recentOrder.amount_czk === 0
                ? "v pilotní verzi zdarma"
                : `${recentOrder.amount_czk.toLocaleString("cs-CZ")} Kč`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline status={recentOrder.status} />
          </CardContent>
        </Card>
      ) : null}

      {!recentOrder || recentOrder.status === "cancelled" ? (
        <Card>
          <CardHeader>
            <CardTitle>Objednat knihu</CardTitle>
            <CardDescription>
              Odešleme ji na vámi zadanou adresu v České republice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ready ? (
              <BookOrderForm familyId={familyId} />
            ) : (
              <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                <p>
                  Zatím nemáte minimum vzpomínek pro tisk. Doplňte další otázky a
                  pokračujte sběrem - kniha bude bohatší.
                </p>
                <Link
                  href={`/family/${familyId}/prompts`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Naplánovat další otázky →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function BookStack({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const ready = value >= target;
  // Stack thickness: 1 page per ~3 memories, capped at 16 visible pages.
  const pages = Math.max(1, Math.min(16, Math.floor(value / 3) || 1));

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
      {/* Visual: stacked pages with cover when ready */}
      <div className="relative mx-auto h-32 w-44 sm:mx-0">
        {/* Stacked pages - each one offset down/right slightly */}
        {Array.from({ length: pages }).map((_, i) => {
          const top = 110 - i * 1.5;
          const left = 4 + i * 1.5;
          return (
            <div
              key={i}
              aria-hidden
              className="absolute h-3 rounded-sm border border-[var(--color-paper-300)] bg-[var(--color-paper-50)]"
              style={{ top, left, right: 4 + (pages - i - 1) * 1.5, opacity: 0.6 + i * 0.025 }}
            />
          );
        })}
        {/* Top cover - only once we hit the target */}
        {ready ? (
          <div
            aria-hidden
            className="absolute left-0 right-0 top-0 flex h-[88px] items-center justify-center rounded-md border border-[var(--color-navy-700)] bg-gradient-to-br from-[var(--color-navy-800)] to-[var(--color-navy-900)] text-[var(--color-gold-300)] shadow-[var(--shadow-md)]"
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
              <polygon
                points="18,3 33,18 18,33 3,18"
                stroke="currentColor"
                strokeWidth="1.4"
                opacity="0.7"
              />
              <polygon
                points="18,11 25,18 18,25 11,18"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.5"
              />
            </svg>
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute left-0 right-0 top-0 flex h-[88px] items-center justify-center rounded-md border-2 border-dashed border-[var(--color-paper-400)] bg-[var(--color-paper-50)]/40 text-[var(--color-text-subtle)]"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.32em]">Sbírka roste</span>
          </div>
        )}
      </div>

      {/* Numeric / progress side */}
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-display)] text-5xl font-medium leading-none text-[var(--color-navy-900)]">
            {value}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            z {target} vzpomínek &middot; {pct} %
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-paper-200)]">
          <div
            className={`h-full transition-[width] duration-500 ${ready ? "bg-[var(--color-gold-500)]" : "bg-[var(--color-navy-800)]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!ready ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            Chybí ještě {target - value}. Naplánujte další otázky a sběr poběží sám.
          </p>
        ) : (
          <p className="text-xs text-[var(--color-gold-600)]">
            Hotovo. Můžete si knihu objednat nebo přidat ještě další vzpomínky.
          </p>
        )}
      </div>
    </div>
  );
}

function Timeline({ status }: { status: string }) {
  const reachedIdx = STATUS_TIMELINE.findIndex((s) => s.key === status);
  const isCancelled = status === "cancelled";

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {STATUS_TIMELINE.map((step, i) => {
        const reached = !isCancelled && i <= reachedIdx;
        return (
          <li
            key={step.key}
            className={
              "rounded-[var(--radius-md)] border p-3 text-sm " +
              (reached
                ? "border-[var(--color-navy-300)] bg-[var(--color-navy-50)]"
                : "border-[var(--color-border)] bg-[var(--color-paper-50)] text-[var(--color-text-muted)]")
            }
          >
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="font-medium">{step.label}</div>
          </li>
        );
      })}
      {isCancelled ? (
        <li className="col-span-full">
          <Badge tone="red">Zrušeno</Badge>
        </li>
      ) : null}
      {!isCancelled ? (
        <li className="col-span-full text-xs text-[var(--color-text-muted)]">
          Aktuální stav: {STATUS_LABEL[status] ?? status}
        </li>
      ) : null}
    </ol>
  );
}
