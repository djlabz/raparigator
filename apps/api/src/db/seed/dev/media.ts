import sharp from "sharp";
import type { Database } from "../../client";
import type { ObjectStorage } from "../../../lib/storage";
import { processImage, storageKeyFor, thumbnailKeyFor } from "../../../modules/media";
import { mediaAssets, mediaHighlights } from "../../schema";
import { fixtures } from "./fixtures";

const SEED_IMAGE_WIDTH = 900;
const SEED_IMAGE_HEIGHT = 1200;
const SEED_IMAGE_CONTENT_TYPE = "image/jpeg";
const THUMBNAIL_CONTENT_TYPE = "image/webp";

function hueFor(seed: string): number {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return hash;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

async function renderSeedImage(slug: string, artisticName: string, index: number) {
  const hue = hueFor(`${slug}-${index}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SEED_IMAGE_WIDTH}" height="${SEED_IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 62%, 46%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 48) % 360}, 68%, 20%)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="54%" font-family="sans-serif" font-size="300" font-weight="700" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">${initialsOf(artisticName)}</text>
  <text x="50%" y="66%" font-family="sans-serif" font-size="64" fill="#ffffff" fill-opacity="0.6" text-anchor="middle">${index + 1}</text>
</svg>`;
  const jpeg = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
  return new Uint8Array(jpeg);
}

type GalleryInput = {
  userId: string;
  profileId: string;
  slug: string;
  artisticName: string;
  imageCount: number;
};

export async function seedGallery(
  db: Database,
  storage: ObjectStorage,
  input: GalleryInput,
): Promise<string[]> {
  const keys: string[] = [];

  for (let index = 0; index < input.imageCount; index += 1) {
    const assetId = `seed-${input.slug}-${index + 1}`;
    const storageKey = storageKeyFor(input.userId, assetId, SEED_IMAGE_CONTENT_TYPE, "gallery");
    const thumbnailKey = thumbnailKeyFor(storageKey);
    const [stored, storedThumbnail] = await Promise.all([
      storage.head(storageKey),
      storage.head(thumbnailKey),
    ]);

    let sizeBytes = stored?.sizeBytes ?? 0;
    if (!stored || !storedThumbnail) {
      const source = await renderSeedImage(input.slug, input.artisticName, index);
      const processed = await processImage(source, SEED_IMAGE_CONTENT_TYPE);
      await storage.putObject(storageKey, processed.clean.data, SEED_IMAGE_CONTENT_TYPE);
      await storage.putObject(thumbnailKey, processed.thumbnail, THUMBNAIL_CONTENT_TYPE);
      sizeBytes = processed.clean.data.byteLength;
    }

    const values = {
      id: assetId,
      ownerUserId: input.userId,
      profileId: input.profileId,
      kind: "image" as const,
      purpose: "gallery" as const,
      status: "ready" as const,
      contentType: SEED_IMAGE_CONTENT_TYPE,
      sizeBytes,
      storageKey,
      thumbnailKey,
      width: SEED_IMAGE_WIDTH,
      height: SEED_IMAGE_HEIGHT,
      position: index,
      processedAt: new Date(),
    };
    await db
      .insert(mediaAssets)
      .values(values)
      .onConflictDoUpdate({ target: mediaAssets.id, set: { ...values, updatedAt: new Date() } });
    keys.push(storageKey);
  }

  return keys;
}

export async function seedMediaHighlights(
  db: Database,
  storage: ObjectStorage,
  galleryKeysBySlug: Map<string, string[]>,
) {
  for (const [position, fixture] of fixtures.mediaHighlights.entries()) {
    const { coverAdSlug, coverImageIndex, ...highlight } = fixture;
    const coverKey = galleryKeysBySlug.get(coverAdSlug)?.[coverImageIndex];
    if (!coverKey) {
      throw new Error(
        `destaque ${highlight.id}: o anúncio ${coverAdSlug} não tem a foto ${coverImageIndex} na seed`,
      );
    }
    const coverUrl = storage.publicUrl(coverKey);
    if (!coverUrl) {
      throw new Error(
        "S3_PUBLIC_BASE_URL ausente: a seed de desenvolvimento precisa da URL pública do storage para as capas dos destaques.",
      );
    }
    const values = { ...highlight, coverUrl, position };
    await db
      .insert(mediaHighlights)
      .values(values)
      .onConflictDoUpdate({ target: mediaHighlights.id, set: values });
  }
}
