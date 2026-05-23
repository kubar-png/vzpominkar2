import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOrderForm } from "./book-form";

export const metadata: Metadata = { title: "Kniha" };

const BOOK_MIN = 30;
const BOOK_FULL = 52;

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
  const pct = Math.min(100, Math.round((memories / BOOK_FULL) * 100));

  return (
    <div className="space-y-10">
      <AppPageHeader
        title="Kniha"
        description="Vaše rodinná kniha vzniká týden po týdnu."
        action={
          memories > 0 ? (
            <Link
              href={`/family/${familyId}/book/preview`}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              Náhled knihy
              <span aria-hidden>↗</span>
            </Link>
          ) : null
        }
      />

      {sp.ordered ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900"
        >
          Děkujeme - objednávku jsme přijali.
        </p>
      ) : null}

      {/* Hero: book mock on left, progress + chapter info on right */}
      {memories === 0 ? (
        <EmptyState
          icon={<BookOpen size={18} aria-hidden />}
          title="Kniha zatím čeká na první stranu"
          description="Až váš blízký nahraje první vzpomínku, objeví se zde její náhled."
        />
      ) : (
        <section className="grid items-start gap-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 md:grid-cols-[auto_1fr] md:gap-10 md:p-8">
          <BookMock memories={memories} ready={ready} />

          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                Připravenost
              </p>
              <p className="mt-1 text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
                {ready
                  ? `Hotovo - ${memories} vzpomínek je připraveno k tisku.`
                  : `${memories} z ${BOOK_MIN} potřebných vzpomínek.`}
              </p>
              {!ready ? (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Chybí ještě {BOOK_MIN - memories}. Sběr poběží sám, jakmile naplánujete další otázky.
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Můžete si knihu objednat, nebo nasbírat ještě další vzpomínky - kniha tím bude bohatší.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between text-xs tabular-nums text-[var(--color-text-muted)]">
                <span>{memories} / {BOOK_FULL} vzpomínek</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-paper-100)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    ready ? "bg-[var(--color-gold-500)]" : "bg-[var(--color-navy-800)]",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {!ready ? (
              <Link
                href={`/family/${familyId}/prompts`}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                Naplánovat další otázku
                <span aria-hidden>↗</span>
              </Link>
            ) : null}
          </div>
        </section>
      )}

      {recentOrder ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
              Vaše poslední objednávka
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {new Date(recentOrder.created_at).toLocaleDateString("cs-CZ")} ·{" "}
              {recentOrder.amount_czk === 0
                ? "v pilotní verzi zdarma"
                : `${recentOrder.amount_czk.toLocaleString("cs-CZ")} Kč`}
            </p>
          </div>
          <Timeline status={recentOrder.status} />
        </section>
      ) : null}

      {(ready && (!recentOrder || recentOrder.status === "cancelled")) ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
              Objednat knihu
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Odešleme ji na vámi zadanou adresu v České republice.
            </p>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-5 md:p-6">
            <BookOrderForm familyId={familyId} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Simplified book mock — leather-bound silhouette with gold spine. Smaller
 * and quieter than the marketing hero treatment, but recognisably the same
 * object. When the book isn't ready yet, the cover dims to a paper outline
 * so it reads as "in progress."
 */
function BookMock({ memories, ready }: { memories: number; ready: boolean }) {
  // 1 page per ~3 memories, capped at 14 visible pages
  const pages = Math.max(1, Math.min(14, Math.floor(memories / 3) || 1));

  return (
    <div className="relative mx-auto h-40 w-32 sm:h-48 sm:w-36">
      {/* Page stack — slightly offset down/right */}
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute rounded-[2px] border border-[var(--color-paper-200)] bg-[var(--color-paper-50)]"
          style={{
            top: 12 + i * 0.6,
            right: 6 + (pages - i - 1) * 0.6,
            bottom: 8 - i * 0.4,
            left: 6 + i * 0.6,
            opacity: 0.55 + i * 0.03,
          }}
        />
      ))}
      {/* Cover */}
      {ready ? (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 flex h-[88%] items-center justify-center rounded-[3px] bg-gradient-to-br from-[#1f2e47] to-[#16243a] shadow-[0_12px_30px_-12px_rgba(8,35,61,0.35)]"
        >
          {/* gold spine */}
          <span
            aria-hidden
            className="absolute inset-y-2 left-1.5 w-0.5 rounded-full bg-[var(--color-gold-500)]/70"
          />
          <BookOpen size={28} className="text-[var(--color-gold-400)]/90" aria-hidden />
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 flex h-[88%] items-center justify-center rounded-[3px] border-2 border-dashed border-[var(--color-paper-300)] bg-white/40"
        >
          <BookOpen size={24} className="text-[var(--color-paper-400)]" aria-hidden />
        </div>
      )}
    </div>
  );
}

function Timeline({ status }: { status: string }) {
  const reachedIdx = STATUS_TIMELINE.findIndex((s) => s.key === status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-white px-5 py-4">
        <Badge tone="red">Zrušeno</Badge>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-5 md:p-6">
      <ol className="grid gap-3 sm:grid-cols-4">
        {STATUS_TIMELINE.map((step, i) => {
          const reached = i <= reachedIdx;
          return (
            <li
              key={step.key}
              className={cn(
                "rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
                reached
                  ? "border-[var(--color-navy-200)] bg-[var(--color-navy-50)] text-[var(--color-navy-900)]"
                  : "border-[var(--color-border)] bg-[var(--color-paper-50)] text-[var(--color-text-muted)]",
              )}
            >
              <div className="text-[11px] tabular-nums text-[var(--color-text-subtle)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="font-medium">{step.label}</div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        Aktuální stav: {STATUS_LABEL[status] ?? status}
      </p>
    </div>
  );
}
