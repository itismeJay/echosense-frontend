import { NextRequest, NextResponse } from "next/server";
import { decideProxy } from "./lib/access";
import { parseValidJwtClaims } from "./lib/auth-token";
import { PASSWORD_CHANGE_COOKIE } from "./lib/session-errors";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("echosense_token")?.value;
  const claims = token ? parseValidJwtClaims(token) : null;
  const decision = decideProxy({
    pathname: request.nextUrl.pathname,
    jwtRole: claims?.role ?? null,
    hadToken: Boolean(token),
    mustChangePassword: request.cookies.get(PASSWORD_CHANGE_COOKIE)?.value === "1",
  });

  const response =
    decision.kind === "redirect"
      ? NextResponse.redirect(new URL(decision.to, request.url))
      : NextResponse.next();
  if (decision.clearToken) {
    response.cookies.delete("echosense_token");
    response.cookies.delete(PASSWORD_CHANGE_COOKIE);
  }
  return response;
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
    "/classrooms/:path*",
    "/devices/:path*",
    "/change-password",
    "/no-access",
    "/login",
  ],
};
