import {
  PASSWORD_CHANGE_COOKIE,
  handleForbiddenDetail,
  type ForbiddenKind,
  type SessionEnvironment,
} from "./session-errors";

export const AUTH_COOKIE = "echosense_token";

function secureAttribute(): string {
  return window.location.protocol === "https:" ? "; secure" : "";
}

export function clearTokenCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

export function setPasswordChangeFlag(required: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = required
    ? `${PASSWORD_CHANGE_COOKIE}=1; path=/; max-age=86400; samesite=strict${secureAttribute()}`
    : `${PASSWORD_CHANGE_COOKIE}=; path=/; max-age=0`;
}

export function clearSessionCookies() {
  clearTokenCookie();
  setPasswordChangeFlag(false);
}

function browserSessionEnvironment(): SessionEnvironment {
  return {
    pathname: window.location.pathname,
    clearToken: clearTokenCookie,
    setPasswordChangeFlag,
    navigate: (destination) => {
      window.location.href = destination;
    },
  };
}

export function handleForbiddenResponse(detail: unknown): ForbiddenKind {
  if (typeof document === "undefined") return "no_permission";
  return handleForbiddenDetail(detail, browserSessionEnvironment());
}
