"use client";

import { Button } from "@/components/ds";

export function PrintButton() {
  return (
    <Button variant="primary" size="sm" iconLeft="printer" onClick={() => window.print()}>
      Stampa report
    </Button>
  );
}
