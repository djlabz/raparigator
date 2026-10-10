import type { ProfessionalAd } from "@sigillus/contracts";
import { createApiClient } from "@/lib/api/client";

export async function fetchProfessionalAdForMetadata(
  slug: string,
): Promise<ProfessionalAd | undefined> {
  try {
    return (await createApiClient().ads.getBySlug({ slug })) ?? undefined;
  } catch {
    return undefined;
  }
}
