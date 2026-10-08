import type { ProfessionalAd } from "@sigillus/contracts";
import { createApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import { ads as mockAds } from "@/lib/mock-data";

export async function fetchProfessionalAdForMetadata(
  slug: string,
): Promise<ProfessionalAd | undefined> {
  if (!isApiDataSource()) {
    return mockAds.find((item) => item.slug === slug);
  }
  try {
    return (await createApiClient().ads.getBySlug({ slug })) ?? undefined;
  } catch {
    return undefined;
  }
}
