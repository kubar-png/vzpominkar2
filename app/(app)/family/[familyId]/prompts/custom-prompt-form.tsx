"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { addCustomPromptAndSchedule } from "@/lib/prompts/actions";

export function CustomPromptForm({
  familyId,
  seniorIds,
}: {
  familyId: string;
  seniorIds: string[];
}) {
  const [pending, start] = useTransition();
  const [scheduleType, setScheduleType] = useState<"queue" | "now" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submit(type: "queue" | "now") {
    const question = String(new FormData(formRef.current!).get("question") ?? "").trim();
    if (!question) return;
    setScheduleType(type);
    start(async () => {
      const result = await addCustomPromptAndSchedule(familyId, question, type, seniorIds);
      if (result.ok) {
        formRef.current?.reset();
        toast.success(type === "now" ? "Otázka odeslána" : "Naplánováno na příští pondělí");
      } else {
        toast.error(result.error ?? "Něco se nepovedlo.");
      }
      setScheduleType(null);
    });
  }

  return (
    <form ref={formRef} className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-1.5">
        <Label htmlFor="question">Vaše otázka</Label>
        <Textarea
          id="question"
          name="question"
          rows={2}
          required
          minLength={8}
          maxLength={280}
          placeholder="Např.: Jak jste se s tátou poprvé setkali na nádraží v roce 1972?"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => submit("now")}
        >
          {pending && scheduleType === "now" ? "Odesílám…" : "Poslat hned"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => submit("queue")}
        >
          {pending && scheduleType === "queue" ? "Ukládám…" : "Přidat do fronty"}
        </Button>
      </div>
    </form>
  );
}
