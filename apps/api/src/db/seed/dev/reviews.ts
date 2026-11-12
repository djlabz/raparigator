import type { Database } from "../../client";
import { reviews } from "../../schema";
import { fixtures } from "./fixtures";

export async function seedReviews(db: Database, profileIdBySlug: Map<string, string>) {
  for (const review of fixtures.reviews) {
    const ad = fixtures.ads.find((item) => item.id === review.adId);
    const profileId = ad ? profileIdBySlug.get(ad.slug) : undefined;
    if (!profileId) {
      continue;
    }
    await db
      .insert(reviews)
      .values({
        id: `seed-review-${review.id}`,
        profileId,
        authorName: review.author,
        score: review.score,
        comment: review.comment,
        isSeed: true,
        createdAt: new Date(review.createdAt),
      })
      .onConflictDoNothing();
  }
}
