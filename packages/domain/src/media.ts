import type { MediaPurpose } from "@sigillus/contracts";

export const MEDIA_EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
};

const VIDEO_EXTENSIONS = Object.entries(MEDIA_EXTENSION_BY_CONTENT_TYPE)
  .filter(([contentType]) => contentType.startsWith("video/"))
  .map(([, extension]) => extension);

const VIDEO_SOURCE_PATTERN = new RegExp(`\\.(${VIDEO_EXTENSIONS.join("|")})(\\?.*)?$`, "i");

export function mediaExtensionFor(contentType: string): string {
  const known = MEDIA_EXTENSION_BY_CONTENT_TYPE[contentType];
  if (known) {
    return known;
  }
  const subtype = contentType.split("/")[1] ?? "bin";
  return subtype.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
}

export function isPublicMediaPurpose(purpose: MediaPurpose): boolean {
  return purpose === "gallery" || purpose === "profile";
}

export function isVideoSource(src: string): boolean {
  if (!src) {
    return false;
  }
  return src.startsWith("data:video") || VIDEO_SOURCE_PATTERN.test(src);
}
