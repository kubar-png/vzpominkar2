"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, AlertTriangle, X, Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";
import { plural } from "@/lib/format/czech-plural";
import { updateSeniorProfile, deleteSeniorAccount } from "@/lib/auth/senior-actions";
import { startVolumeCheckout } from "@/lib/stripe/checkout";

interface SeniorCardProps {
  familyId: string;
  senior: {
    id: string;
    display_name: string | null;
    username: string | null;
    senior_role: string | null;
    contact_channel: string | null;
    contact_address: string | null;
    prompt_frequency: number;
    is_senior: boolean;
    memoryCount: number;
    book: {
      kind: "none" | "collecting" | "finished";
      answered: number;
      cap: number;
      sequenceNo: number;
    };
  };
  manageHref: string;
}

type Phase = "view" | "edit" | "delete";

function roleLabel(role: string | null): string | null {
  if (!role) return null;
  return SENIOR_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? null;
}

const MEMORY_FORMS = ["vzpomínka", "vzpomínky", "vzpomínek"] as const;

export function SeniorCard({ familyId, senior, manageHref }: SeniorCardProps) {
  const [phase, setPhase] = useState<Phase>("view");
  const [editName, setEditName] = useState(senior.display_name ?? "");
  const [editRole, setEditRole] = useState(senior.senior_role ?? "");
  const [editChannel, setEditChannel] = useState(senior.contact_channel ?? "");
  const [editAddress, setEditAddress] = useState(senior.contact_address ?? "");
  const [editFrequency, setEditFrequency] = useState(senior.prompt_frequency ?? 1);
  const [editIsSenior, setEditIsSenior] = useState(senior.is_senior ?? true);
  const [deleteInput, setDeleteInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function resetEdit() {
    setEditName(senior.display_name ?? "");
    setEditRole(senior.senior_role ?? "");
    setEditChannel(senior.contact_channel ?? "");
    setEditAddress(senior.contact_address ?? "");
    setEditFrequency(senior.prompt_frequency ?? 1);
    setEditIsSenior(senior.is_senior ?? true);
    setError(null);
    setPhase("view");
  }

  function handleSave() {
    setError(null);
    start(async () => {
      const result = await updateSeniorProfile(familyId, senior.id, {
        displayName: editName.trim(),
        seniorRole: editRole || null,
        contactChannel: editChannel || null,
        contactAddress: editAddress.trim() || null,
        promptFrequency: editFrequency as 1 | 2,
        isSenior: editIsSenior,
      });
      if (result.ok) {
        setPhase("view");
        toast.success("Uloženo");
        router.refresh();
      } else {
        setError(result.error ?? "Nepodařilo se uložit.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    start(async () => {
      const result = await deleteSeniorAccount(familyId, senior.id);
      if (result.ok) {
        toast.success(`Účet ${senior.display_name ?? "blízkého"} smazán`);
      } else {
        setError(result.error ?? "Smazání selhalo.");
      }
      // On success the page refreshes via revalidatePath - no need to router.refresh()
    });
  }

  if (phase === "edit") {
    return (
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 md:px-6">
          <p className="text-[15px] font-semibold tracking-tight text-[var(--color-navy-900)]">
            Upravit blízkého
          </p>
        </div>
        <div className="space-y-6 p-5 md:p-6">
          <FormSection title="Profil" hideDivider compact>
            <div className="space-y-1.5">
              <Label htmlFor={`name-${senior.id}`}>Celé jméno</Label>
              <Input
                id={`name-${senior.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`role-${senior.id}`}>Role v rodině</Label>
              <Select
                id={`role-${senior.id}`}
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="">- nevybráno -</option>
                {SENIOR_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </div>
          </FormSection>

          <FormSection title="Doručování" description="Kam a jak často chodí otázky." compact>
            <div className="space-y-1.5">
              <Label htmlFor={`channel-${senior.id}`}>Způsob doručení</Label>
              <Select
                id={`channel-${senior.id}`}
                value={editChannel}
                onChange={(e) => setEditChannel(e.target.value)}
              >
                <option value="">- nevybráno -</option>
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`address-${senior.id}`}>E-mail nebo telefon (WhatsApp)</Label>
              <Input
                id={`address-${senior.id}`}
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                maxLength={200}
                placeholder="jana@email.cz nebo +420 777 123 456"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`freq-${senior.id}`}>Frekvence</Label>
              <Select
                id={`freq-${senior.id}`}
                value={editFrequency}
                onChange={(e) => setEditFrequency(Number(e.target.value) as 1 | 2)}
              >
                <option value={1}>Jednou týdně</option>
                <option value={2}>Dvakrát týdně</option>
              </Select>
            </div>
          </FormSection>

          <FormSection title="Režim aplikace" description="Jak se vašemu blízkému aplikace zobrazí." compact>
            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] p-3 hover:border-[var(--color-navy-700)]">
              <input
                type="radio"
                name={`mode-${senior.id}`}
                checked={editIsSenior === true}
                onChange={() => setEditIsSenior(true)}
                className="mt-1"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)]">Senior režim</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  Velká tlačítka, kontrastní typografie, jednoduchý flow. Bez možnosti editace přepisu. Pro starší uživatele.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] p-3 hover:border-[var(--color-navy-700)]">
              <input
                type="radio"
                name={`mode-${senior.id}`}
                checked={editIsSenior === false}
                onChange={() => setEditIsSenior(false)}
                className="mt-1"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)]">Klasický režim</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  Kompaktnější UI, vyprávějící může sám editovat přepis nahrávky, vylepšit text s AI a vybírat otázky z archivu.
                </p>
              </div>
            </label>
          </FormSection>

          {error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetEdit} disabled={pending}>
              <X size={14} /> Zrušit
            </Button>
            <Button size="sm" onClick={handleSave} disabled={pending || !editName.trim()}>
              <Check size={14} /> {pending ? "Ukládám…" : "Uložit"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "delete") {
    return (
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-red-200)] bg-white">
        <div className="flex items-center gap-2 border-b border-[var(--color-red-200)] bg-[var(--color-red-50)]/40 px-5 py-3 md:px-6">
          <AlertTriangle size={14} className="text-[var(--color-red-700)]" />
          <p className="text-[15px] font-semibold tracking-tight text-[var(--color-red-800)]">
            Nevratná akce
          </p>
        </div>
        <div className="space-y-4 p-5 md:p-6">
          <p className="text-sm leading-relaxed text-[var(--color-text)]">
            Smazáním účtu <strong>{senior.display_name ?? "blízkého"}</strong> dojde k trvalému
            odstranění přístupu a všech propojených dat. Tuto akci nelze vrátit.
          </p>
          {senior.memoryCount > 0 && (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
              Upozornění: Váš blízký má {senior.memoryCount} {plural(senior.memoryCount, MEMORY_FORMS)}.
              Zvažte je nejprve uložit jinak.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={`confirm-${senior.id}`}>
              Pro potvrzení napište{" "}
              <span className="font-mono font-semibold text-[var(--color-text)]">smazat</span>
            </Label>
            <Input
              id={`confirm-${senior.id}`}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="smazat"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDeleteInput(""); setError(null); setPhase("view"); }}
              disabled={pending}
            >
              <X size={14} /> Zrušit
            </Button>
            <Button
              size="sm"
              disabled={pending || deleteInput !== "smazat"}
              onClick={handleDelete}
              className="bg-[var(--color-red-600)] text-white hover:bg-[var(--color-red-700)]"
            >
              <Trash2 size={14} /> {pending ? "Mažu…" : "Smazat navždy"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: view
  const label = roleLabel(senior.senior_role);
  const initial = (senior.display_name ?? "B").trim().charAt(0).toUpperCase();
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-6 p-5 md:p-6">
        <div className="flex min-w-0 items-start gap-4">
          {/* Avatar with initial — no photo yet */}
          <div
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-100)] text-base font-semibold text-[var(--color-navy-700)]"
          >
            {initial}
          </div>
          <div className="min-w-0">
            {/* Name — card-title (Inter 17/600) per DESIGN.md */}
            <p className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
              {senior.display_name ?? "Senior"}
            </p>
            {label ? (
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{label}</p>
            ) : null}

            {/* Secondary info — quieter, single block */}
            <div className="mt-3 space-y-0.5 text-xs text-[var(--color-text-subtle)]">
              <p className="font-mono text-[var(--color-text-muted)]">
                {senior.username}
              </p>
              {senior.contact_address ? (
                <p>
                  {senior.contact_channel === "whatsapp" ? "WhatsApp" : "E-mail"}: {senior.contact_address}
                </p>
              ) : null}
              <p className="tabular-nums">
                {senior.memoryCount} {plural(senior.memoryCount, MEMORY_FORMS)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={manageHref}
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]"
          >
            Spravovat
          </Link>
          <details className="relative">
            <summary
              aria-label="Další akce"
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)] [&::-webkit-details-marker]:hidden"
            >
              <MoreHorizontal size={16} aria-hidden />
            </summary>
            <div className="absolute right-0 top-12 z-10 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
              <button
                type="button"
                onClick={() => setPhase("edit")}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-paper-100)]"
              >
                <Pencil size={14} aria-hidden />
                Upravit
              </button>
              <button
                type="button"
                onClick={() => setPhase("delete")}
                className="flex w-full items-center gap-2.5 border-t border-[var(--color-border)] px-4 py-3 text-left text-sm text-[var(--color-red-700)] transition-colors hover:bg-[var(--color-red-50)]"
              >
                <Trash2 size={14} aria-hidden />
                Smazat účet
              </button>
            </div>
          </details>
        </div>
      </div>

      {/* Book status + purchase CTA — activate a new senior's book or buy the
          next volume as it nears/reaches the 52-question cap. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-3 md:px-6">
        <p className="text-xs text-[var(--color-text-muted)]">
          {senior.book.kind === "none"
            ? "Kniha zatím není aktivní."
            : senior.book.kind === "finished"
              ? `Díl ${senior.book.sequenceNo} je hotový — ${senior.book.cap} z ${senior.book.cap} otázek.`
              : `Díl ${senior.book.sequenceNo} — ${senior.book.answered} z ${senior.book.cap} otázek.`}
        </p>
        {senior.book.kind === "none" ? (
          <form action={startVolumeCheckout.bind(null, senior.id)}>
            <button
              type="submit"
              className="inline-flex h-11 cursor-pointer items-center rounded-[var(--radius-md)] bg-[var(--color-navy-900)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-navy-800)]"
            >
              Aktivovat knihu
            </button>
          </form>
        ) : senior.book.kind === "finished" ||
          senior.book.answered >= Math.max(1, senior.book.cap - 7) ? (
          <form action={startVolumeCheckout.bind(null, senior.id)}>
            <button
              type="submit"
              className="inline-flex h-11 cursor-pointer items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-navy-700)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-900)]"
            >
              Pořídit Díl {senior.book.sequenceNo + 1}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
