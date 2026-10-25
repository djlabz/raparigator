import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl } from "@/lib/data-source";
import { isEarningsSimulatorEnabled } from "@/lib/earnings-simulator-flag";

const ADMIN_LOGIN_PATH = "/admin/login";
const USER_LOGIN_PATH = "/auth/login";
const PROFESSIONAL_AREA_PATH = "/profissional";
const PROFESSIONAL_ROLE = "profissional";
const NON_PROFESSIONAL_HOME = "/feed";
const EARNINGS_SIMULATOR_PATH = "/profissional/simulador";

type ApiSession = { user?: { role?: unknown } };

async function getApiSession(request: NextRequest, path: string): Promise<ApiSession | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return null;
  }
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as unknown;
    return body !== null && typeof body === "object" ? (body as ApiSession) : null;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(EARNINGS_SIMULATOR_PATH) && !isEarningsSimulatorEnabled()) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return NextResponse.next();
    }
    const session = await getApiSession(request, "/api/admin-auth/get-session");
    return session ? NextResponse.next() : redirectToLogin(request, ADMIN_LOGIN_PATH);
  }

  const session = await getApiSession(request, "/api/auth/get-session");
  if (!session) {
    return redirectToLogin(request, USER_LOGIN_PATH);
  }
  if (pathname.startsWith(PROFESSIONAL_AREA_PATH) && session.user?.role !== PROFESSIONAL_ROLE) {
    return redirectTo(request, NON_PROFESSIONAL_HOME);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/conta/:path*", "/profissional/:path*", "/admin/:path*"],
};
