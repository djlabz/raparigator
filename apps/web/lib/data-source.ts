export const DEFAULT_API_URL = "http://localhost:4000";

export function getApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

export function isApiDataSource(): boolean {
  return true;
}
