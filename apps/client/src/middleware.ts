import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import type { Role } from "@homelabconnect/shared";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { ROLE_INFO, roleToPath } from "@/lib/auth/roles";

const ROLE_PATHS = Object.values(ROLE_INFO).map((info) => info.path);

// Role is decoded (not signature-verified) purely for routing UX; the API
// enforces real authorization on every request via the Bearer token.
function decodeRole(token: string): Role | null {
  try {
    return (decodeJwt(token) as { role: Role }).role;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const role = token ? decodeRole(token) : null;
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && role) {
    return NextResponse.redirect(new URL(roleToPath(role), request.url));
  }

  const isRolePath = ROLE_PATHS.some((path) => pathname.startsWith(path));
  if (isRolePath) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!pathname.startsWith(roleToPath(role))) {
      return NextResponse.redirect(new URL(roleToPath(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/med-team/:path*",
    "/support/:path*",
  ],
};
