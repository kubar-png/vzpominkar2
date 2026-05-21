"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2 } from "lucide-react";
import { savePhotoMemory } from "@/lib/memories/actions";
import { SeniorButton } from "@/components/senior/SeniorButton";
import { SeniorInput, SeniorLabel } from "@/components/senior/SeniorInput";

const MAX_LONG_EDGE = 2560;
const JPEG_QUALITY = 0.85;

interface PickedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

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
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      {/* Hidden native input - driven by the visible buttons below */}
      <input
        ref={fileRef}
        id="photo"
        name="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPickFile}
        className="sr-only"
      />

      {/* Scrollable content zone */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {!hasPhotos ? (
          <div className="space-y-3">
            <SeniorLabel htmlFor="photo">Vaše fotky</SeniorLabel>
            <SeniorButton
              type="button"
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
            >
              <Camera size={20} className="-ml-1" aria-hidden />
              {processing ? "Připravuji…" : "Vyfotit nebo vybrat fotku"}
            </SeniorButton>
            <p className="text-sm text-paper-500">
              Můžete fotku vyfotit hned teď nebo vybrat ze své galerie.
              Pak můžete přidat další.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <SeniorLabel>Vaše fotky ({photos.length})</SeniorLabel>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <li key={p.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.previewUrl}
                    alt="Náhled fotky"
                    className="aspect-square w-full rounded-[var(--radius-senior-input)] object-cover bg-paper-100"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    aria-label="Odebrat fotku"
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-md hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <SeniorButton
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
            >
              <Plus size={20} className="-ml-1" aria-hidden />
              {processing ? "Připravuji…" : "Přidat další fotku"}
            </SeniorButton>
          </div>
        )}

        {/* Caption */}
        <div>
          <SeniorLabel htmlFor="caption">Krátký popis (volitelný)</SeniorLabel>
          <SeniorInput
            id="caption"
            name="caption"
            placeholder='Např. "Rok 1962, my u babičky"'
            maxLength={120}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[var(--radius-senior-input)] border-2 border-red-200 bg-red-50 p-4 text-[length:var(--text-senior)] text-red-700"
          >
            {error}
          </p>
        )}
      </div>

      {/* Bottom bar - submit always visible */}
      <div className="shrink-0 flex items-center justify-end px-6 py-2 border-t border-paper-200 bg-paper-50">
        <SeniorButton type="submit" variant="primary" size="md" disabled={pending || !hasPhotos}>
          {pending ? "Nahráváme…" : photos.length > 1 ? `Uložit ${photos.length} fotek` : "Uložit fotku"}
        </SeniorButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Client-side downscale: phones produce 12+MB photos that take forever to    */
/* upload on rural Czech LTE. Resize to 2560px on the long edge as JPEG.      */
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
