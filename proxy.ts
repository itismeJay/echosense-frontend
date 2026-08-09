import { NextRequest, NextResponse } from "next/server";
import { parseValidJwtClaims } from "./lib/auth-token";

const ADMIN_ONLY_PATHS = ["/users", "/admin"];
const COUNSELOR_PATHS = ["/counselor", "/analytics"];

function redirectAndClearToken(request: NextRequest, destination: string) {
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete("echosense_token");
  return response;
}

function continueAndClearToken() {
  const response = NextResponse.next();
  response.cookies.delete("echosense_token");
  return response;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("echosense_token")?.value;
  const claims = token ? parseValidJwtClaims(token) : null;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";

  if (isLogin) {
    return claims
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : token
        ? continueAndClearToken()
        : NextResponse.next();
  }
  if (!claims) return redirectAndClearToken(request, "/login");

  if (
    ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
    claims.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    COUNSELOR_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
    claims.role !== "admin" &&
    claims.role !== "counselor"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alert/:path*",
    "/alerts/:path*",
    "/analytics/:path*",
    "/logs/:path*",
    "/profile/:path*",
    "/counselor/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/login",
  ],
};
