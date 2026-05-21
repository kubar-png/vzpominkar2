"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookPreviewClient() {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => window.print()}
    >
      <Printer size={14} aria-hidden className="mr-1.5" />
      Tisk / PDF
    </Button>
  );
}
