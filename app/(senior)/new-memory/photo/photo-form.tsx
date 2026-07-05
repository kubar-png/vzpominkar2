"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2 } from "lucide-react";
import { savePhotoMemory } from "@/lib/memories/actions";
import { plural } from "@/lib/format/czech-plural";

const MAX_LONG_EDGE = 2560;
const JPEG_QUALITY = 0.85;

interface PickedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

/**
 * Photo memory form — editorial reskin.
 *
 * Client-side compression and the Server Action upload are untouched.
 * Only the surface changed: editorial card, raspberry pill, framed
 * previews.
 */
export function PhotoMemoryForm({ assignmentId }: { assignmentId: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!f) return;
    setError(null);
    if (!f.type.startsWith("image/")) {
      setError("Soubor musí být obrázek.");
      return;
    }
    setProcessing(true);
    try {
      const compressed = await compressImage(f);
      setPhotos((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
        },
      ]);
    } catch {
      setPhotos((prev) => [
        ...prev,
        { id: crypto.randomUUID(), file: f, previewUrl: URL.createObjectURL(f) },
      ]);
    } finally {
      setProcessing(false);
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (photos.length === 0) {
      setError("Vyberte fotku, prosím.");
      return;
    }
    const fd = new FormData();
    for (const p of photos) fd.append("photo", p.file);
    const captionEl = e.currentTarget.elements.namedItem("caption") as HTMLInputElement | null;
    if (captionEl?.value) fd.set("caption", captionEl.value);
    if (assignmentId) fd.set("assignmentId", assignmentId);

    startTransition(async () => {
      const result = await savePhotoMemory(null, fd);
      if (result?.ok === false) setError(result.error);
      else router.push("/my-memories?saved=1");
    });
  }

  const hasPhotos = photos.length > 0;

  return (
    <form onSubmit={onSubmit} className="es-card space-y-7">
      <input
        ref={fileRef}
        id="photo"
        name="photo"
        type="file"
        accept="image/*"
        onChange={onPickFile}
        className="sr-only"
      />

      {!hasPhotos ? (
        <div className="space-y-4">
          <label className="es-label" htmlFor="photo">
            Vaše fotky
          </label>

          {/* Large drop / upload zone */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-[color:var(--line-2)] bg-[var(--paper-2)] text-center transition-colors hover:border-[color:var(--gold)] hover:bg-white"
            style={{
              padding: "44px 24px",
              minHeight: 208,
              cursor: processing ? "not-allowed" : "pointer",
              opacity: processing ? 0.6 : 1,
            }}
          >
            <span
              aria-hidden
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--gold)", color: "#FEF7D7" }}
            >
              <Camera size={30} />
            </span>
            <div
              className="text-[22px] font-medium mb-1"
              style={{ color: "var(--ink)", fontFamily: "var(--font-display-editorial)" }}
            >
              {processing ? "Připravuji…" : "Vyfotit nebo vybrat fotku"}
            </div>
            <p className="text-[16px]" style={{ color: "var(--ink-soft)" }}>
              Z mobilu, tabletu nebo počítače
            </p>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <label className="es-label">Vaše fotky ({photos.length})</label>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt="Náhled fotky"
                  className="aspect-square w-full rounded-lg object-cover"
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    boxShadow: "0 4px 12px -4px rgba(27, 46, 77, 0.18)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Odebrat fotku"
                  className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: "var(--paper)",
                    color: "var(--oxblood)",
                    boxShadow: "0 4px 12px rgba(27, 46, 77, 0.2)",
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="es-btn es-btn-outline w-full sm:w-auto"
          >
            <Plus size={20} aria-hidden />
            {processing ? "Připravuji…" : "Přidat další fotku"}
          </button>
        </div>
      )}

      {/* Caption + save appear once at least one photo is picked, so the
          screen starts as a single clear action (pick a photo) instead of a
          greyed-out disabled button. */}
      {hasPhotos ? (
        <div className="space-y-6">
          <div>
            <label className="es-label" htmlFor="caption">
              Krátký popis (volitelný)
            </label>
            <input
              id="caption"
              name="caption"
              type="text"
              placeholder='Např. „Rok 1962, my u babičky"'
              maxLength={120}
              className="es-input"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={pending} className="es-btn es-btn-gold">
              {pending
                ? "Nahráváme…"
                : photos.length > 1
                  ? `Uložit ${photos.length} ${plural(photos.length, ["fotku", "fotky", "fotek"])}`
                  : "Uložit fotku"}
              {!pending && <span className="arrow" aria-hidden>↗</span>}
            </button>
          </div>
        </div>
      ) : null}

      {error && (
        <div role="alert" className="es-banner es-banner-error">
          {error}
        </div>
      )}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Client-side downscale — unchanged from the previous version.               */
/* -------------------------------------------------------------------------- */

async function compressImage(file: File): Promise<File> {
  if (file.size < 1_500_000) return file;

  const bitmap = await createImageBitmap(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  if (longEdge <= MAX_LONG_EDGE) {
    bitmap.close?.();
    return file;
  }

  const scale = MAX_LONG_EDGE / longEdge;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
