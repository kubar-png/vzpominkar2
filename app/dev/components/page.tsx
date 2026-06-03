import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { SeniorButton } from "@/components/senior/SeniorButton";
import { SeniorCard } from "@/components/senior/SeniorCard";
import { SeniorHeading } from "@/components/senior/SeniorHeading";
import {
  SeniorInput,
  SeniorTextarea,
  SeniorLabel,
} from "@/components/senior/SeniorInput";

export const metadata = { title: "Komponenty (dev)" };

const NAVY = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;
const RED = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;
const PAPER = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

export default function ComponentsPage() {
  return (
    <div className="mx-auto max-w-[var(--container-wide)] space-y-16 px-6 py-12">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
        <div className="flex items-center gap-4">
          <Logo variant="symbol" size={40} />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
              Vzpomínkář - Design system
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">M2 preview · dev only</p>
          </div>
        </div>
        <Badge tone="navy">v0.1</Badge>
      </header>

      {/* COLORS */}
      <Section title="Barvy" subtitle="Brand palette + warm cream paper neutrals.">
        <ColorRow label="Navy (primary)" prefix="navy" steps={NAVY} />
        <ColorRow label="Red (accent)" prefix="red" steps={RED} />
        <ColorRow label="Paper (neutrals)" prefix="paper" steps={PAPER} />
      </Section>

      {/* TYPOGRAPHY */}
      <Section title="Typografie" subtitle="Display: Fraunces · Sans: Inter">
        <div className="space-y-4">
          <p className="font-[family-name:var(--font-display)] text-7xl tracking-tight">Display 7xl</p>
          <p className="font-[family-name:var(--font-display)] text-5xl tracking-tight">Display 5xl</p>
          <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight">Display 3xl</p>
          <p className="text-2xl">Sans 2xl</p>
          <p className="text-lg">Sans lg - body lead</p>
          <p className="text-base">Sans base - body default</p>
          <p className="text-sm text-[var(--color-text-muted)]">Sans sm muted</p>
        </div>
      </Section>

      {/* RADIUS */}
      <Section title="Roundness" subtitle="Owner UI defaults to md/xl. Senior UI uses senior tokens (14-20px).">
        <div className="flex flex-wrap gap-4">
          {[
            ["xs", "var(--radius-xs)"],
            ["sm", "var(--radius-sm)"],
            ["md", "var(--radius-md)"],
            ["lg", "var(--radius-lg)"],
            ["xl", "var(--radius-xl)"],
            ["2xl", "var(--radius-2xl)"],
            ["3xl", "var(--radius-3xl)"],
            ["full", "var(--radius-full)"],
          ].map(([name, val]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="h-20 w-20 border-2 border-[var(--color-navy-800)]"
                style={{ borderRadius: val }}
              />
              <code className="text-xs">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      {/* SHADOWS */}
      <Section title="Shadows" subtitle="Navy-tinted, paper-like.">
        <div className="grid gap-6 sm:grid-cols-3">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
            <div
              key={s}
              className="flex h-24 items-center justify-center rounded-[var(--radius-lg)] bg-white"
              style={{ boxShadow: `var(--shadow-${s})` }}
            >
              <code>shadow-{s}</code>
            </div>
          ))}
        </div>
      </Section>

      {/* OWNER COMPONENTS */}
      <Section title="Owner UI primitives" subtitle="Used in /dashboard and admin surfaces.">
        <div className="space-y-6">
          <Group label="Button">
            <Button variant="primary">Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link button</Button>
            <Button variant="danger">Smazat</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </Group>

          <Group label="Badge">
            <Badge>Neutral</Badge>
            <Badge tone="navy">Aktivní</Badge>
            <Badge tone="red">Pozor</Badge>
            <Badge tone="success">Dokončeno</Badge>
          </Group>

          <Group label="Card">
            <div className="grid w-full gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vzpomínka týdne</CardTitle>
                  <CardDescription>Maminka odpověděla 24. dubna</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--color-text-muted)]">
                    {"„Můj první školní den byl plný strachu a nadšení zároveň…“"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[var(--color-navy-50)]">
                <CardHeader>
                  <CardTitle>Roční přístup</CardTitle>
                  <CardDescription>Aktivní do 4. května 2027</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Děkujeme. Vaše rodina může v klidu sbírat vzpomínky celý rok.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Group>

          <Group label="Input + Textarea">
            <div className="w-full max-w-md space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="vy@rodina.cz" />
              </div>
              <div>
                <Label htmlFor="msg">Krátký popis</Label>
                <Textarea id="msg" placeholder="Sem pište…" />
              </div>
            </div>
          </Group>
        </div>
      </Section>

      {/* SENIOR COMPONENTS */}
      <Section
        title="Senior surface primitives"
        subtitle="Větší, klidnější, s vyšším kontrastem. Min. 60 px klikací cíle."
      >
        <div data-surface="senior" className="space-y-8 rounded-[var(--radius-2xl)] bg-[var(--color-paper-100)] p-8">
          <SeniorHeading level={1}>Otázka týdne</SeniorHeading>
          <SeniorCard className="space-y-6">
            <SeniorHeading level={2}>
              Vzpomínáte si na svůj první školní den?
            </SeniorHeading>
            <p>Můžete odpovědět hlasem, písmem nebo přidat fotku. Není kam spěchat.</p>
            <div className="flex flex-wrap gap-4">
              <SeniorButton variant="accent" size="xl">Nahrát odpověď</SeniorButton>
              <SeniorButton variant="primary" size="xl">Napsat odpověď</SeniorButton>
              <SeniorButton variant="secondary" size="xl">Přidat fotku</SeniorButton>
            </div>
          </SeniorCard>

          <SeniorCard className="space-y-4">
            <SeniorLabel htmlFor="senior-title">Pojmenujte svou vzpomínku</SeniorLabel>
            <SeniorInput id="senior-title" placeholder="Např. První školní den" />
            <SeniorLabel htmlFor="senior-text" className="pt-2">
              Vaše odpověď
            </SeniorLabel>
            <SeniorTextarea id="senior-text" placeholder="Tady prosím pište…" />
            <div className="mt-6 flex justify-end gap-4">
              <SeniorButton variant="secondary">Začít znovu</SeniorButton>
              <SeniorButton variant="primary">Hotovo, uložit</SeniorButton>
            </div>
          </SeniorCard>
        </div>
      </Section>
    </div>
  );
}

/* -------------------------- helpers -------------------------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="border-b border-[var(--color-border)] pb-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function ColorRow({
  label,
  prefix,
  steps,
}: {
  label: string;
  prefix: "navy" | "red" | "paper";
  steps: readonly string[];
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {steps.map((step) => (
          <div key={step} className="flex w-20 flex-col items-center gap-1">
            <div
              className="h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]"
              style={{ background: `var(--color-${prefix}-${step})` }}
            />
            <code className="text-[10px]">{step}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
