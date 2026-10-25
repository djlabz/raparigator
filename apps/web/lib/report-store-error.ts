export type StoreErrorKind = "unauthenticated" | "forbidden" | "not_found" | "network" | "unknown";

function readCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function classifyStoreError(error: unknown): StoreErrorKind {
  const code = readCode(error);
  if (code === "UNAUTHORIZED") return "unauthenticated";
  if (code === "FORBIDDEN") return "forbidden";
  if (code === "NOT_FOUND") return "not_found";
  if (code) return "unknown";
  if (error instanceof TypeError) return "network";
  return "unknown";
}

export function isUnauthenticatedError(error: unknown): boolean {
  const kind = classifyStoreError(error);
  return kind === "unauthenticated" || kind === "forbidden";
}

export function storeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function reportStoreError(scope: string, error: unknown): StoreErrorKind {
  const kind = classifyStoreError(error);
  if (process.env.NODE_ENV !== "production" && typeof console !== "undefined") {
    console.warn(`[sigillus:${scope}] ${kind}`, error);
  }
  return kind;
}
