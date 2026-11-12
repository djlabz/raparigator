import type { Database } from "../../client";
import type { ObjectStorage } from "../../../lib/storage";
import { seedAdminActivity } from "./activity";
import { seedClients } from "./clients";
import { seedConversations } from "./conversations";
import { seedMediaHighlights } from "./media";
import { seedProfessionals } from "./professionals";
import { seedReports } from "./reports";
import { seedReviews } from "./reviews";

export async function seedDevData(db: Database, storage: ObjectStorage) {
  const { profileIdBySlug, galleryKeysBySlug } = await seedProfessionals(db, storage);
  await seedReviews(db, profileIdBySlug);
  await seedMediaHighlights(db, storage, galleryKeysBySlug);
  await seedClients(db);
  await seedReports(db);
  await seedAdminActivity(db);
  await seedConversations(db, profileIdBySlug);
  return { profiles: profileIdBySlug };
}
