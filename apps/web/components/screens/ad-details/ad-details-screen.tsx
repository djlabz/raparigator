"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAdDetails } from "./use-ad-details";
import { PremiumAdDetailsScreen } from "./premium-ad-details-screen";
import { StandardAdDetailsScreen } from "./standard-ad-details-screen";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useRegisterAdView } from "@/lib/ad-data";
import { consumeReturnScroll } from "@/lib/auth-return";
import { useScrollToAnchorUntilStable } from "@/lib/use-scroll-to-anchor-until-stable";

interface AdDetailsScreenProps {
  slug: string;
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
  const { ad, isLoading, isPremium } = useAdDetails(slug);
  useRegisterAdView(slug, Boolean(ad));
  const pathname = usePathname();

  const [returnScroll] = useState(() => consumeReturnScroll(pathname));
  const [anchorId] = useState(() =>
    typeof window === "undefined" ? null : window.location.hash.slice(1) || null,
  );

  useScrollToAnchorUntilStable(returnScroll, anchorId);

  if (isLoading) {
    return <AppShell>{null}</AppShell>;
  }

  if (!ad) {
    return (
      <AppShell>
        <EmptyState
          title="Esse encanto não está mais aqui"
          description="O perfil pode ter saído do ar ou mudado de endereço. Volta e escolhe outro que te faça piscadinha."
        />
      </AppShell>
    );
  }

  if (isPremium) {
    return <PremiumAdDetailsScreen slug={slug} />;
  }

  return <StandardAdDetailsScreen slug={slug} />;
}
