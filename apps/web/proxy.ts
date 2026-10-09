import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl } from "@/lib/data-source";

const ADMIN_LOGIN_PATH = "/admin/login";
const USER_LOGIN_PATH = "/auth/login";

async function hasApiSession(request: NextRequest, path: string): Promise<boolean> {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return false;
  }
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) {
      return false;
    }
    const body = (await response.json()) as unknown;
    return body !== null && typeof body === "object";
  } catch {
    return false;
  }
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return NextResponse.next();
    }
    const authorized = await hasApiSession(request, "/api/admin-auth/get-session");
    return authorized ? NextResponse.next() : redirectToLogin(request, ADMIN_LOGIN_PATH);
  }

  const authorized = await hasApiSession(request, "/api/auth/get-session");
  return authorized ? NextResponse.next() : redirectToLogin(request, USER_LOGIN_PATH);
}

export const config = {
  matcher: [
    "/conta/:path*",
    "/profissional/anuncios/:path*",
    "/profissional/assinatura-premium/:path*",
    "/admin/:path*",
  ],
};
