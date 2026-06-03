"use client";

import { useState, useTransition } from "react";
import { FlipBook, type FlipBookMemory } from "@/components/book/FlipBook";
import { CoverPicker } from "@/components/book/CoverPicker";
import {
  defaultTextFor,
  isLegibleCover,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";
import { updateBookCover } from "@/lib/book/cover-actions";

interface BookPreviewClientProps {
  familyId: string;
  familyName: string;
  year: number;
  initialCoverBg: CoverBg;
  initialCoverText: CoverText;
  memories: FlipBookMemory[];
}

/**
 * Client-side orchestrator for the flipping book preview. Owns the cover
 * background + foil/ink state (seeded from the persisted book) and remounts the
 * FlipBook on change (react-pageflip does not re-render children once mounted).
 * Each change is applied optimistically and persisted via a server action;
 * a failed save reverts to the last-known-good combo.
 */
export function BookPreviewClient({
  familyId,
  familyName,
  year,
  initialCoverBg,
  initialCoverText,
  memories,
}: BookPreviewClientProps) {
  const [bg, setBg] = useState<CoverBg>(initialCoverBg);
  const [text, setText] = useState<CoverText>(initialCoverText);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Persist a full combo, reverting both colours together if the save fails.
  function persist(nextBg: CoverBg, nextText: CoverText) {
    const prevBg = bg;
    const prevText = text;
    setBg(nextBg);
    setText(nextText);
    setError(null);
    startTransition(async () => {
      const res = await updateBookCover(familyId, { bg: nextBg, text: nextText });
      if (!res.ok) {
        setBg(prevBg);
        setText(prevText);
        setError(res.error);
      }
    });
  }

  function handleBg(nextBg: CoverBg) {
    // Mirror the picker's legibility guard so we persist a legal combo even if
    // the current ink becomes illegal under the new background.
    const nextText = isLegibleCover(nextBg, text) ? text : defaultTextFor(nextBg);
    persist(nextBg, nextText);
  }

  function handleText(nextText: CoverText) {
    persist(bg, nextText);
  }

  return (
    <div className="space-y-8">
      {/* Stage with the actual flipping book */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-paper-100,#f1e8d0)]/40 p-4 md:p-8">
        <FlipBook
          familyName={familyName}
          year={year}
          coverBg={bg}
          coverText={text}
          memories={memories}
        />
        <p className="mt-6 text-center text-[12px] text-[var(--color-text-subtle)]">
          Pro otočení listu táhněte za roh, klikněte na okraj knihy, nebo na mobilu swipněte.
        </p>
      </div>

      {/* Cover picker */}
      <div className="space-y-3">
        <CoverPicker bg={bg} text={text} onChangeBg={handleBg} onChangeText={handleText} />
        {error ? (
          <p className="text-[13px] text-[var(--color-danger,#a8231f)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
