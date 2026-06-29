"use client";

import { useAdDetails } from "./use-ad-details";
import { PremiumAdDetailsScreen } from "./premium-ad-details-screen";
import { StandardAdDetailsScreen } from "./standard-ad-details-screen";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";

interface AdDetailsScreenProps {
  slug: string;
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
  const { ad, isPremium } = useAdDetails(slug);

  if (!ad) {
    return (
      <AppShell>
        <EmptyState title="Perfil nao encontrado" description="Esse anuncio pode ter sido removido ou alterado." />
      </AppShell>
    );
  }

  if (isPremium) {
    return <PremiumAdDetailsScreen slug={slug} />;
  }

  return <StandardAdDetailsScreen slug={slug} />;
}
