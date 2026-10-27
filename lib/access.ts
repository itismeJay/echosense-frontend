// Single source of truth for who may open which page. proxy.ts, the Sidebar, and the
// (app) layout's page guard all read this table, so they cannot disagree. The backend
// still authorizes every request; this only decides what the UI offers.

export type AccessRole = "super_admin" | "admin" | "counselor" | "staff";

export interface AccessSubject {
  role: string;
  is_super_admin?: boolean;
}

const EVERYONE: readonly AccessRole[] = ["super_admin", "admin", "counselor", "staff"];
const GUIDANCE: readonly AccessRole[] = ["super_admin", "admin", "counselor"];
const ADMINS: readonly AccessRole[] = ["super_admin", "admin"];
const SUPER_ADMIN: readonly AccessRole[] = ["super_admin"];

export const NO_ACCESS_PATH = "/no-access";

// The most specific (longest) matching prefix wins.
export const ROUTE_ACCESS: ReadonlyArray<{ prefix: string; roles: readonly AccessRole[] }> = [
  { prefix: "/overview", roles: EVERYONE },
  { prefix: "/alerts", roles: EVERYONE },
  { prefix: "/alert", roles: EVERYONE },
  { prefix: "/profile", roles: EVERYONE },
  { prefix: "/change-password", roles: EVERYONE },
  { prefix: NO_ACCESS_PATH, roles: EVERYONE },
  { prefix: "/reports", roles: GUIDANCE },
  { prefix: "/classrooms", roles: ADMINS },
  { prefix: "/people", roles: ADMINS },
  { prefix: "/activity", roles: ADMINS },
  { prefix: "/settings", roles: ADMINS },
  { prefix: "/schools", roles: SUPER_ADMIN },
];

/** Where each role lands after signing in (super admins start at All schools). */
export function homePathFor(role: AccessRole | null): string {
  return role === "super_admin" ? "/schools" : "/overview";
}

/**
 * Pages that show one school's data. A super admin opens them only after entering a
 * school; outside a school they are sent to All schools to pick one.
 */
const SCHOOL_PAGE_PREFIXES = [
  "/overview",
  "/alerts",
  "/alert",
  "/reports",
  "/classrooms",
  "/people",
  "/settings/hours",
  "/settings/sensitivity",
];

export function isSchoolPage(pathname: string): boolean {
  return SCHOOL_PAGE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function accessRoleOf(user: AccessSubject | null | undefined): AccessRole | null {
  if (!user) return null;
  if (user.role === "admin") return user.is_super_admin === true ? "super_admin" : "admin";
  if (user.role === "counselor" || user.role === "staff") return user.role;
  return null;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function routeRolesFor(pathname: string): readonly AccessRole[] | null {
  let best: { prefix: string; roles: readonly AccessRole[] } | null = null;
  for (const rule of ROUTE_ACCESS) {
    if (matchesPrefix(pathname, rule.prefix) && (!best || rule.prefix.length > best.prefix.length)) {
      best = rule;
    }
  }
  return best?.roles ?? null;
}

/** Client-side check using the /auth/me user (knows is_super_admin). */
export function canAccessPath(role: AccessRole | null, pathname: string): boolean {
  const roles = routeRolesFor(pathname);
  if (!roles) return true;
  return role !== null && roles.includes(role);
}

/**
 * Proxy-side check using only the JWT role. The token cannot tell a super admin from a
 * school admin, so an "admin" token may reach super-admin pages; their client guard
 * then shows the No access page to school admins.
 */
export function proxyAllowsPath(jwtRole: string, pathname: string): boolean {
  const roles = routeRolesFor(pathname);
  if (!roles) return true;
  if (jwtRole === "admin") return roles.includes("admin") || roles.includes("super_admin");
  return roles.includes(jwtRole as AccessRole);
}

export function isSuperAdmin(user: AccessSubject | null | undefined): boolean {
  return accessRoleOf(user) === "super_admin";
}

/** Global engine info, OTA, the global word list and schools are super-admin only on the backend. */
export function canEditGlobalConfig(user: AccessSubject | null | undefined): boolean {
  return isSuperAdmin(user);
}

export type NavIconKey =
  | "overview"
  | "alerts"
  | "reports"
  | "classrooms"
  | "people"
  | "activity"
  | "settings"
  | "schools"
  | "words";

export interface NavItemConfig {
  href: string;
  icon: NavIconKey;
  label: string;
}

export type NavMode = "school" | "platform";

/** One school's pages: what staff, counselors and admins see, and a super admin inside a school. */
const SCHOOL_NAV: NavItemConfig[] = [
  { href: "/overview", icon: "overview", label: "Overview" },
  { href: "/alerts", icon: "alerts", label: "Alerts" },
  { href: "/reports", icon: "reports", label: "Reports" },
  { href: "/classrooms", icon: "classrooms", label: "Classrooms" },
  { href: "/people", icon: "people", label: "People" },
  { href: "/activity", icon: "activity", label: "Activity" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

/** A super admin outside any school. */
const PLATFORM_NAV: NavItemConfig[] = [
  { href: "/schools", icon: "schools", label: "All schools" },
  { href: "/settings/words", icon: "words", label: "Monitored words" },
  { href: "/settings", icon: "settings", label: "Detection settings" },
  { href: "/activity", icon: "activity", label: "Platform activity" },
];

export function navItemsFor(role: AccessRole | null, mode: NavMode = "school"): NavItemConfig[] {
  if (role === "super_admin" && mode === "platform") return PLATFORM_NAV;
  return SCHOOL_NAV.filter((item) => canAccessPath(role, item.href));
}

/** The nav item a path belongs to: the longest matching href wins (/settings/words over /settings). */
export function activeNavHref(items: NavItemConfig[], pathname: string): string | null {
  let best: string | null = null;
  for (const item of items) {
    if (matchesPrefix(pathname, item.href) && (!best || item.href.length > best.length)) best = item.href;
  }
  return best;
}

export type ProxyDecision =
  | { kind: "next"; clearToken: boolean }
  | { kind: "redirect"; to: string; clearToken: boolean };

/** Pure routing decision for proxy.ts; `jwtRole` is null when the token is missing or invalid. */
export function decideProxy(input: {
  pathname: string;
  jwtRole: string | null;
  hadToken: boolean;
  mustChangePassword: boolean;
}): ProxyDecision {
  const { pathname, jwtRole, hadToken, mustChangePassword } = input;
  if (pathname === "/login") {
    if (jwtRole) {
      return {
        kind: "redirect",
        to: mustChangePassword ? "/change-password" : "/overview",
        clearToken: false,
      };
    }
    return { kind: "next", clearToken: hadToken };
  }
  if (!jwtRole) return { kind: "redirect", to: "/login", clearToken: true };
  if (mustChangePassword && pathname !== "/change-password") {
    return { kind: "redirect", to: "/change-password", clearToken: false };
  }
  if (!proxyAllowsPath(jwtRole, pathname)) {
    return {
      kind: "redirect",
      to: `${NO_ACCESS_PATH}?from=${encodeURIComponent(pathname)}`,
      clearToken: false,
    };
  }
  return { kind: "next", clearToken: false };
}
