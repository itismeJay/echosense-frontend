import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  ROUTE_ACCESS,
  accessRoleOf,
  canAccessPath,
  canEditGlobalConfig,
  canFilterBySchool,
  decideProxy,
  navSectionsFor,
  proxyAllowsPath,
  routeRolesFor,
} from "../lib/access.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const STAFF_PAGES = ["/dashboard", "/alerts", "/logs", "/profile"];
const COUNSELOR_PAGES = [...STAFF_PAGES, "/counselor", "/analytics"];
const ADMIN_PAGES = [
  ...COUNSELOR_PAGES,
  "/settings",
  "/classrooms",
  "/devices",
  "/users",
  "/admin/heartbeat",
  "/admin/dictionary",
  "/admin/audit",
  "/admin/logs",
  "/admin/heatmap",
];
const SUPER_ADMIN_PAGES = [...ADMIN_PAGES, "/admin/schools"];
const ALL_PAGES = SUPER_ADMIN_PAGES;

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

  test(`sidebar shows exactly the reachable pages for ${role}`, () => {
    const hrefs = navSectionsFor(role).flatMap((section) => section.items.map((item) => item.href));
    assert.deepEqual([...hrefs].sort(), [...allowed].sort());
  });
}

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
  assert.equal(proxyAllowsPath("admin", "/admin/schools"), true);
  assert.equal(canAccessPath("admin", "/admin/schools"), false);
});

test("proxy shows the No access page instead of a silent redirect", () => {
  assert.deepEqual(
    decideProxy({ pathname: "/users", jwtRole: "staff", hadToken: true, mustChangePassword: false }),
    { kind: "redirect", to: "/no-access?from=%2Fusers", clearToken: false }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/settings", jwtRole: "counselor", hadToken: true, mustChangePassword: false }),
    { kind: "redirect", to: "/no-access?from=%2Fsettings", clearToken: false }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/analytics", jwtRole: "counselor", hadToken: true, mustChangePassword: false }),
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
  assert.match(sidebar, /navSectionsFor\(accessRoleOf\(user\)\)/);
  assert.match(layout, /canAccessPath\(accessRoleOf\(user\), pathname\)/);
  assert.match(layout, /<NoAccess \/>/);
});

test("no page or component gates on role === \"admin\" alone any more", async () => {
  const files = [
    "app/(app)/users/page.tsx",
    "app/(app)/settings/page.tsx",
    "app/(app)/admin/dictionary/page.tsx",
    "app/(app)/admin/heartbeat/page.tsx",
    "app/(app)/admin/logs/page.tsx",
    "app/(app)/admin/heatmap/page.tsx",
    "app/(app)/counselor/page.tsx",
    "components/AuditLogDashboard.tsx",
    "components/Sidebar.tsx",
  ];
  for (const file of files) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /role !== "admin"|role === "admin"/, file);
  }
});

test("global configuration and school filters are super-admin only", () => {
  assert.equal(canEditGlobalConfig(USERS.super_admin), true);
  assert.equal(canFilterBySchool(USERS.super_admin), true);
  for (const role of ["admin", "counselor", "staff"]) {
    assert.equal(canEditGlobalConfig(USERS[role]), false, role);
    assert.equal(canFilterBySchool(USERS[role]), false, role);
  }
});
