import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  ROUTE_ACCESS,
  accessRoleOf,
  canAccessPath,
  canEditGlobalConfig,
  activeNavHref,
  decideProxy,
  homePathFor,
  isSchoolPage,
  navItemsFor,
  proxyAllowsPath,
  routeRolesFor,
} from "../lib/access.ts";
import { LEGACY_REDIRECTS } from "../lib/legacy-routes.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const STAFF_PAGES = ["/overview", "/alerts", "/alerts/all", "/profile"];
const COUNSELOR_PAGES = [...STAFF_PAGES, "/reports"];
const ADMIN_PAGES = [
  ...COUNSELOR_PAGES,
  "/classrooms",
  "/people",
  "/activity",
  "/activity/system",
  "/settings",
  "/settings/words",
];
const SUPER_ADMIN_PAGES = [...ADMIN_PAGES, "/schools"];
const ALL_PAGES = SUPER_ADMIN_PAGES;

// The sidebar: staff 2 items, counselor 3, admin 7.
const NAV = {
  staff: ["/overview", "/alerts"],
  counselor: ["/overview", "/alerts", "/reports"],
  admin: ["/overview", "/alerts", "/reports", "/classrooms", "/people", "/activity", "/settings"],
};

const EXPECTED = {
  super_admin: SUPER_ADMIN_PAGES,
  admin: ADMIN_PAGES,
  counselor: COUNSELOR_PAGES,
  staff: STAFF_PAGES,
};

const USERS = {
  super_admin: { role: "admin", is_super_admin: true },
  admin: { role: "admin", is_super_admin: false },
  counselor: { role: "counselor", is_super_admin: false },
  staff: { role: "staff" },
};

test("access role comes from the /auth/me user, never from the role alone", () => {
  assert.equal(accessRoleOf(USERS.super_admin), "super_admin");
  assert.equal(accessRoleOf(USERS.admin), "admin");
  assert.equal(accessRoleOf({ role: "admin" }), "admin");
  // is_super_admin only counts for role=admin, as on the backend (is_global_admin).
  assert.equal(accessRoleOf({ role: "staff", is_super_admin: true }), "staff");
  assert.equal(accessRoleOf(null), null);
});

for (const [role, allowed] of Object.entries(EXPECTED)) {
  test(`page guard matrix for ${role}`, () => {
    for (const page of ALL_PAGES) {
      assert.equal(canAccessPath(role, page), allowed.includes(page), `${role} ${page}`);
      assert.equal(canAccessPath(role, `${page}/123`), allowed.includes(page), `${role} ${page}/123`);
    }
  });

}

for (const [role, hrefs] of Object.entries(NAV)) {
  test(`sidebar for ${role} has exactly ${hrefs.length} items`, () => {
    assert.deepEqual(navItemsFor(role).map((item) => item.href), hrefs);
    for (const href of hrefs) assert.equal(canAccessPath(role, href), true, href);
  });
}

test("super admin sidebar: the admin's 7 pages inside a school, 4 platform pages outside", () => {
  assert.deepEqual(navItemsFor("super_admin", "school").map((item) => item.href), NAV.admin);
  assert.deepEqual(
    navItemsFor("super_admin", "platform").map((item) => [item.href, item.label]),
    [
      ["/schools", "All schools"],
      ["/settings/words", "Monitored words"],
      ["/settings", "Detection settings"],
      ["/activity", "Platform activity"],
    ]
  );
  // Platform mode is only for super admins; everyone else always gets school pages.
  assert.deepEqual(navItemsFor("admin", "platform").map((item) => item.href), NAV.admin);
  assert.deepEqual(navItemsFor("staff", "platform").map((item) => item.href), NAV.staff);
});

test("the active nav item is the longest matching href", () => {
  const platform = navItemsFor("super_admin", "platform");
  assert.equal(activeNavHref(platform, "/settings/words"), "/settings/words");
  assert.equal(activeNavHref(platform, "/settings"), "/settings");
  const school = navItemsFor("admin");
  assert.equal(activeNavHref(school, "/alerts/all"), "/alerts");
  assert.equal(activeNavHref(school, "/alerts/10"), "/alerts");
  assert.equal(activeNavHref(school, "/activity/system"), "/activity");
  assert.equal(activeNavHref(school, "/profile"), null);
});

test("super admins land on All schools and must enter a school for school pages", () => {
  assert.equal(homePathFor("super_admin"), "/schools");
  for (const role of ["admin", "counselor", "staff"]) assert.equal(homePathFor(role), "/overview");
  for (const page of ["/overview", "/alerts", "/alerts/10", "/reports", "/classrooms/1", "/people"]) {
    assert.equal(isSchoolPage(page), true, page);
  }
  for (const page of ["/schools", "/settings", "/settings/words", "/activity", "/profile"]) {
    assert.equal(isSchoolPage(page), false, page);
  }
});

test("every old URL redirects to its new home, and nothing points at a missing page", async () => {
  const config = await readSource("next.config.ts");
  assert.match(config, /LEGACY_REDIRECTS\.map/);
  const routes = await appPageRoutes();
  const sources = LEGACY_REDIRECTS.map((route) => route.source);
  for (const old of [
    "/dashboard", "/logs", "/counselor", "/analytics", "/devices", "/devices/:id", "/users",
    "/admin/heartbeat", "/admin/heatmap", "/admin/dictionary", "/admin/audit", "/admin/logs",
    "/admin/schools",
  ]) {
    assert.ok(sources.includes(old), `no redirect for ${old}`);
  }
  for (const { source, destination } of LEGACY_REDIRECTS) {
    assert.ok(routes.includes(destination), `${source} -> ${destination} is not a page`);
    assert.ok(!routes.includes(source), `${source} is still a page and a redirect`);
  }
});

test("proxy agrees with the page guard; an admin token may reach super-admin pages", () => {
  for (const page of ALL_PAGES) {
    for (const role of ["staff", "counselor"]) {
      assert.equal(proxyAllowsPath(role, page), canAccessPath(role, page), `${role} ${page}`);
    }
    assert.equal(
      proxyAllowsPath("admin", page),
      canAccessPath("admin", page) || canAccessPath("super_admin", page),
      `admin ${page}`
    );
  }
  // ...and the client guard then stops a school admin there.
  assert.equal(proxyAllowsPath("admin", "/schools"), true);
  assert.equal(canAccessPath("admin", "/schools"), false);
});

test("proxy shows the No access page instead of a silent redirect", () => {
  assert.deepEqual(
    decideProxy({ pathname: "/people", jwtRole: "staff", hadToken: true, mustChangePassword: false }),
    { kind: "redirect", to: "/no-access?from=%2Fpeople", clearToken: false }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/settings", jwtRole: "counselor", hadToken: true, mustChangePassword: false }),
    { kind: "redirect", to: "/no-access?from=%2Fsettings", clearToken: false }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/reports", jwtRole: "staff", hadToken: true, mustChangePassword: false }),
    { kind: "redirect", to: "/no-access?from=%2Freports", clearToken: false }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/reports", jwtRole: "counselor", hadToken: true, mustChangePassword: false }),
    { kind: "next", clearToken: false }
  );
});

async function appPageRoutes(directory = new URL("../app/(app)/", import.meta.url), prefix = "") {
  const routes = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith("[") ? "1" : entry.name;
      routes.push(
        ...(await appPageRoutes(new URL(`${entry.name}/`, directory), `${prefix}/${segment}`))
      );
    } else if (entry.name === "page.tsx") {
      routes.push(prefix || "/");
    }
  }
  return routes;
}

test("every protected page has an access rule and is covered by the proxy matcher", async () => {
  const proxy = await readSource("proxy.ts");
  const routes = [...(await appPageRoutes()), "/change-password"];
  for (const route of routes) {
    assert.ok(routeRolesFor(route), `no access rule for ${route}`);
    const top = `/${route.split("/")[1]}`;
    assert.ok(
      proxy.includes(`"${top}/:path*"`) || proxy.includes(`"${top}"`),
      `proxy matcher misses ${top}`
    );
  }
  for (const rule of ROUTE_ACCESS) assert.ok(rule.roles.length > 0, rule.prefix);
});

test("proxy, Sidebar and the (app) guard all use lib/access.ts", async () => {
  const [proxy, sidebar, layout] = await Promise.all([
    readSource("proxy.ts"),
    readSource("components/Sidebar.tsx"),
    readSource("app/(app)/layout.tsx"),
  ]);
  assert.match(proxy, /from "\.\/lib\/access"/);
  assert.match(sidebar, /navItemsFor\(role, mode\)/);
  assert.match(sidebar, /role = accessRoleOf\(user\)/);
  assert.match(layout, /canAccessPath\(role, pathname\)/);
  assert.match(layout, /role = accessRoleOf\(user\)/);
  assert.match(layout, /<NoAccess \/>/);
});

test("no page or component gates on role === \"admin\" alone any more", async () => {
  const files = [
    "app/(app)/people/page.tsx",
    "app/(app)/settings/page.tsx",
    "app/(app)/settings/words/page.tsx",
    "app/(app)/activity/system/page.tsx",
    "app/(app)/reports/page.tsx",
    "components/AuditLogDashboard.tsx",
    "components/Sidebar.tsx",
    "components/TopBar.tsx",
  ];
  for (const file of files) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /\.role !== "admin"|\.role === "admin"/, file);
  }
});

test("global configuration is super-admin only", () => {
  assert.equal(canEditGlobalConfig(USERS.super_admin), true);
  for (const role of ["admin", "counselor", "staff"]) {
    assert.equal(canEditGlobalConfig(USERS[role]), false, role);
  }
});

test("per-page school filters are gone; the entered school scopes every request", async () => {
  for (const file of [
    "components/AlertsView.tsx",
    "app/(app)/classrooms/page.tsx",
    "app/(app)/classrooms/[id]/page.tsx",
    "app/(app)/people/page.tsx",
    "app/(app)/reports/page.tsx",
  ]) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /useSchools|canFilterBySchool|school-filter/, file);
  }
  const api = await readSource("lib/api.ts");
  assert.match(api, /withSchoolScope\(path, getSchoolScope\(\)\)/);
});
