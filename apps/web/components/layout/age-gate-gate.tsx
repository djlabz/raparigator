"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AgeGateScreen } from "@/components/screens/age-gate-screen";
import { useAgeGate } from "@/lib/age-gate";

const AGE_GATE_EXEMPT_PATHS = new Set(["/denuncia"]);

export function AgeGateGate({ children }: { children: ReactNode }) {
  const { status } = useAgeGate();
  const pathname = usePathname();

  if (AGE_GATE_EXEMPT_PATHS.has(pathname)) {
    return children;
  }

  if (status === "pending") {
    return <div className="min-h-dvh bg-zinc-50" aria-busy="true" />;
  }

  if (status === "unverified") {
    return <AgeGateScreen />;
  }

  return children;
}
