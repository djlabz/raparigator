"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthSession } from "@/lib/auth-session";
import { EarningsSimulator } from "./earnings-simulator";
import { PremiumCta } from "./premium-cta";

export function EarningsSimulatorScreen() {
  const router = useRouter();
  const { role } = useAuthSession();

  useEffect(() => {
    if (role === "cliente") {
      router.replace("/feed");
    }
  }, [role, router]);

  return (
    <AppShell>
      {role === "profissional" ? (
        <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4">
          <EarningsSimulator />
          <PremiumCta />
        </div>
      ) : null}
    </AppShell>
  );
}
