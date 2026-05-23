"use client";

import { useState } from "react";
import { FlipBook, type FlipBookMemory } from "@/components/book/FlipBook";
import { CoverPicker } from "@/components/book/CoverPicker";
import type { CoverVariant } from "@/components/book/BookCover";

interface BookPreviewClientProps {
  familyName: string;
  year: number;
  memories: FlipBookMemory[];
}

/**
 * Client-side orchestrator for the flipping book preview. Owns the
 * cover-variant state and remounts the FlipBook on change (react-pageflip
 * does not re-render children once mounted).
 */
export function BookPreviewClient({ familyName, year, memories }: BookPreviewClientProps) {
  const [variant, setVariant] = useState<CoverVariant>("navy");

  return (
    <div className="space-y-8">
      {/* Stage with the actual flipping book */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-paper-100,#f1e8d0)]/40 p-4 md:p-8">
        <FlipBook
          familyName={familyName}
          year={year}
          variant={variant}
          memories={memories}
        />
        <p className="mt-6 text-center text-[12px] text-[var(--color-text-subtle)]">
          Pro otočení listu táhněte za roh, klikněte na okraj knihy, nebo na mobilu swipněte.
        </p>
      </div>

      {/* Cover picker */}
      <CoverPicker value={variant} onChange={setVariant} />
    </div>
  );
}
