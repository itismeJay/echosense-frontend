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
  { prefix: "/dashboard", roles: EVERYONE },
  { prefix: "/alerts", roles: EVERYONE },
  { prefix: "/alert", roles: EVERYONE },
  { prefix: "/logs", roles: EVERYONE },
  { prefix: "/profile", roles: EVERYONE },
  { prefix: "/change-password", roles: EVERYONE },
  { prefix: NO_ACCESS_PATH, roles: EVERYONE },
  { prefix: "/counselor", roles: GUIDANCE },
  { prefix: "/analytics", roles: GUIDANCE },
  { prefix: "/settings", roles: ADMINS },
  { prefix: "/classrooms", roles: ADMINS },
  { prefix: "/devices", roles: ADMINS },
  { prefix: "/users", roles: ADMINS },
  { prefix: "/admin", roles: ADMINS },
  { prefix: "/admin/schools", roles: SUPER_ADMIN },
];

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

/** Global settings, OTA, monitored terms and schools are super-admin only on the backend. */
export function canEditGlobalConfig(user: AccessSubject | null | undefined): boolean {
  return isSuperAdmin(user);
}

/** Only super admins see data from more than one school, so only they get a school filter. */
export function canFilterBySchool(user: AccessSubject | null | undefined): boolean {
  return isSuperAdmin(user);
}

export type NavIconKey =
  | "dashboard"
  | "alerts"
  | "history"
  | "settings"
  | "profile"
  | "counselor"
  | "reports"
  | "classrooms"
  | "devices"
  | "users"
  | "heartbeat"
  | "dictionary"
  | "audit"
  | "logs"
  | "heatmap"
  | "schools";

export interface NavItemConfig {
  href: string;
  icon: NavIconKey;
  label: string;
}

export interface NavSectionConfig {
  label?: string;
  items: NavItemConfig[];
}

const NAV_SECTIONS: NavSectionConfig[] = [
  {
    items: [
      { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
      { href: "/alerts", icon: "alerts", label: "Alerts" },
      { href: "/logs", icon: "history", label: "History" },
      { href: "/settings", icon: "settings", label: "Settings" },
      { href: "/profile", icon: "profile", label: "Profile" },
    ],
  },
  {
    label: "Guidance",
    items: [
      { href: "/counselor", icon: "counselor", label: "Counselor Overview" },
      { href: "/analytics", icon: "reports", label: "Reports and Trends" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/classrooms", icon: "classrooms", label: "Classrooms" },
      { href: "/devices", icon: "devices", label: "Edge Devices" },
      { href: "/users", icon: "users", label: "User Accounts" },
      { href: "/admin/heartbeat", icon: "heartbeat", label: "Device Status" },
      { href: "/admin/dictionary", icon: "dictionary", label: "Monitored Terms" },
      { href: "/admin/audit", icon: "audit", label: "Audit History" },
      { href: "/admin/logs", icon: "logs", label: "Technical Logs" },
      { href: "/admin/heatmap", icon: "heatmap", label: "Classroom Area Map" },
    ],
  },
  {
    label: "Platform",
    items: [{ href: "/admin/schools", icon: "schools", label: "Schools" }],
  },
];

export function navSectionsFor(role: AccessRole | null): NavSectionConfig[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessPath(role, item.href)),
  })).filter((section) => section.items.length > 0);
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
        to: mustChangePassword ? "/change-password" : "/dashboard",
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
