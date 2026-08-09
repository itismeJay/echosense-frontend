export const REVIEWER_ROLES = ["admin", "staff", "counselor"] as const;
export type ReviewerRole = (typeof REVIEWER_ROLES)[number];

export interface ValidJwtClaims {
  sub: string;
  email: string;
  role: ReviewerRole;
  exp: number;
}

export function isReviewerRole(value: unknown): value is ReviewerRole {
  return typeof value === "string" && REVIEWER_ROLES.includes(value as ReviewerRole);
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

/**
 * Performs an optimistic browser/proxy claim check only. The backend remains
 * authoritative and verifies the JWT signature and current account state.
 */
export function parseValidJwtClaims(
  token: string,
  nowMilliseconds = Date.now()
): ValidJwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
    if (
      typeof payload.sub !== "string" ||
      !payload.sub.trim() ||
      typeof payload.email !== "string" ||
      !payload.email.trim() ||
      !isReviewerRole(payload.role) ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= nowMilliseconds / 1000
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
