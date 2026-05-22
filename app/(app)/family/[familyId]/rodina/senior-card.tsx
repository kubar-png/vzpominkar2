"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, AlertTriangle, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";
import { updateSeniorProfile, deleteSeniorAccount } from "@/lib/auth/senior-actions";

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
  };
  manageHref: string;
}

type Phase = "view" | "edit" | "delete";

function roleLabel(role: string | null): string | null {
  if (!role) return null;
  return SENIOR_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? null;
}

function pluralMemories(n: number): string {
  return n === 1 ? "vzpomínka" : n >= 2 && n <= 4 ? "vzpomínky" : "vzpomínek";
}

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
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-navy-50)] px-6 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-navy-700)]">
            Upravit blízkého
          </p>
        </div>
        <div className="space-y-4 p-6">
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

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Doručování otázek
            </p>
            <div className="space-y-3">
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
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Režim aplikace
            </p>
            <div className="space-y-2">
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
            </div>
          </div>

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
      <div className="overflow-hidden rounded-[var(--radius-xl)] border-2 border-[var(--color-red-200)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-red-100)] bg-[var(--color-red-50)] px-6 py-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-red-700)]">
            <AlertTriangle size={13} />
            Nevratná akce
          </p>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm leading-relaxed text-[var(--color-text)]">
            Smazáním účtu <strong>{senior.display_name ?? "blízkého"}</strong> dojde k trvalému
            odstranění přístupu a všech propojených dat. Tuto akci nelze vrátit.
          </p>
          {senior.memoryCount > 0 && (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">
              Upozornění: Váš blízký má {senior.memoryCount} {pluralMemories(senior.memoryCount)}.
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
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-6 p-6">
        <div>
          {/* Name + role - primary identity block */}
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--color-navy-900)]">
            {senior.display_name ?? "Senior"}
          </p>
          {label ? (
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--color-gold-500)]">
              {label}
            </p>
          ) : null}

          {/* Secondary info - separated with visual gap */}
          <div className="mt-4 space-y-1">
            <p className="font-mono text-sm text-[var(--color-text-muted)]">
              {senior.username}
            </p>
            {senior.contact_address ? (
              <p className="text-xs text-[var(--color-text-subtle)]">
                {senior.contact_channel === "whatsapp" ? "WhatsApp" : "E-mail"}: {senior.contact_address}
              </p>
            ) : null}
            <p className="text-xs text-[var(--color-text-subtle)]">
              {senior.memoryCount} {pluralMemories(senior.memoryCount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={manageHref}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]"
          >
            Správa přístupu
          </Link>
          <button
            type="button"
            onClick={() => setPhase("edit")}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] p-1.5 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]"
            title="Upravit"
          >
            <Pencil size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setPhase("delete")}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] p-1.5 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-red-300)] hover:text-[var(--color-red-600)]"
            title="Smazat"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
