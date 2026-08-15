import type { AppDeps } from "../deps";

export type RequestInfo = {
  headers: Headers;
  ip: string;
};

export type AppContext = {
  request: RequestInfo;
  deps: AppDeps;
};

export function createAppContext(deps: AppDeps, request: RequestInfo): AppContext {
  return { request, deps };
}

export function resolveClientIp(headers: Headers, fallback = "unknown"): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return headers.get("x-real-ip") ?? fallback;
}
