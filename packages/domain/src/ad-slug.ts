import { AD_SLUG_PATTERN } from "@sigillus/contracts";
import { normalizeText } from "./format";

const AD_PATH_PATTERN = new RegExp(`^/?anuncio/(${AD_SLUG_PATTERN.source.slice(1, -1)})/?$`);

export type AdTarget = { targetUrl: string } | { profileSlug: string };

export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function slugFromAdUrl(targetUrl: string): string | null {
  try {
    const { pathname } = new URL(targetUrl);
    return AD_PATH_PATTERN.exec(pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function parseAdTarget(value: string): AdTarget | null {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return { targetUrl: new URL(trimmed).toString() };
    } catch {
      return null;
    }
  }
  const path = AD_PATH_PATTERN.exec(trimmed);
  if (path?.[1]) {
    return { profileSlug: path[1] };
  }
  const slug = trimmed.toLowerCase();
  return AD_SLUG_PATTERN.test(slug) ? { profileSlug: slug } : null;
}
