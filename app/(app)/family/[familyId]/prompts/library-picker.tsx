"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/app/FilterPill";
import { scheduleNextMonday, scheduleToday } from "@/lib/prompts/actions";
import { cn } from "@/lib/utils";

interface Group {
  key: string;
  label: string;
  prompts: { id: string; question: string }[];
}

export function LibraryPicker({
  familyId,
  groups,
  seniorIds,
}: {
  familyId: string;
  groups: Group[];
  seniorIds: string[];
}) {
  const [activeTab, setActiveTab] = useState<string>(groups[0]?.key ?? "");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyType, setBusyType] = useState<"queue" | "now" | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  function add(promptId: string, type: "queue" | "now") {
    setBusyId(promptId);
    setBusyType(type);
    start(async () => {
      const result = type === "now"
        ? await scheduleToday(familyId, promptId, seniorIds)
        : await scheduleNextMonday(familyId, promptId, seniorIds);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        setAdded((prev) => new Set([...prev, promptId]));
        toast.success(type === "now" ? "Otázka odeslána" : "Naplánováno na příští pondělí");
      }
      setBusyId(null);
      setBusyType(null);
    });
  }

  const activeGroup = groups.find((g) => g.key === activeTab);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Žádné otázky v knihovně.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <FilterPill
            key={g.key}
            active={g.key === activeTab}
            onClick={() => setActiveTab(g.key)}
          >
            {g.label}
          </FilterPill>
        ))}
      </div>

      {activeGroup ? (
        <ScrollList resetKey={activeTab}>
          {activeGroup.prompts.map((p) => {
            const isAdded = added.has(p.id);
            const isBusy = pending && busyId === p.id;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  isAdded
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-[var(--color-border)] bg-white",
                )}
              >
                <span
                  className={cn(
                    "text-sm leading-relaxed",
                    isAdded ? "text-emerald-900" : "text-[var(--color-text)]",
                  )}
                >
                  {p.question}
                </span>

                {isAdded ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <Check size={14} aria-hidden />
                    Naplánováno
                  </span>
                ) : (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => add(p.id, "now")}
                    >
                      {isBusy && busyType === "now" ? "…" : "Poslat hned"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => add(p.id, "queue")}
                    >
                      {isBusy && busyType === "queue" ? "…" : "Do fronty"}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ScrollList>
      ) : null}
    </div>
  );
}

/**
 * Capped-height list (~7 rows) with a custom always-visible scrollbar on the
 * right. Native scrollbars are unreliable across browsers (Safari hides them
 * in overlay mode), so we hide the native one and draw our own draggable
 * thumb — it's always visible when the list overflows, making it obvious the
 * area scrolls.
 */
function ScrollList({ children, resetKey }: { children: React.ReactNode; resetKey: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { clientHeight, scrollHeight, scrollTop } = el;
    const visible = scrollHeight > clientHeight + 2;
    if (!visible) {
      setThumb({ height: 0, top: 0, visible: false });
      return;
    }
    const height = Math.max(32, (clientHeight / scrollHeight) * clientHeight);
    const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - height) || 0;
    setThumb({ height, top, visible: true });
  }, []);

  useEffect(() => {
    // remeasure when the category changes or after layout settles
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [resetKey, measure]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  function onThumbDown(e: React.PointerEvent) {
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const startY = e.clientY;
    const startScroll = el.scrollTop;
    const track = el.clientHeight - thumb.height;
    const scrollable = el.scrollHeight - el.clientHeight;
    function move(ev: PointerEvent) {
      const dy = ev.clientY - startY;
      el!.scrollTop = startScroll + (track > 0 ? (dy / track) * scrollable : 0);
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={measure}
        className="vzp-scroll-hidden max-h-[30rem] overflow-y-auto pr-4"
      >
        <ul className="space-y-2">{children}</ul>
      </div>
      {thumb.visible ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute right-0.5 top-1 bottom-1 w-2 rounded-full bg-[var(--color-paper-200)]"
          />
          <div
            aria-hidden
            onPointerDown={onThumbDown}
            className="absolute right-0.5 w-2 cursor-grab rounded-full bg-[var(--color-navy-700)] transition-colors hover:bg-[var(--color-navy-900)] active:cursor-grabbing"
            style={{ height: thumb.height, top: thumb.top }}
          />
        </>
      ) : null}
    </div>
  );
}
