import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NEW_USER_ROLE_OPTIONS, buildNewUserPayload } from "../lib/user-admin.ts";
import { accessRoleOf, canAccessPath, navItemsFor } from "../lib/access.ts";

const JOHN_HOPKINS = "cc5c511c-0a33-4ecb-bcaa-b00302b59879";
const form = (role, schoolId = JOHN_HOPKINS) => ({
  email: ` ${role}@JohnHopkins.test `,
  password: "Temporary123",
  role,
  schoolId,
});

test("Add person offers all three roles in plain words", () => {
  assert.deepEqual(NEW_USER_ROLE_OPTIONS, [
    { value: "admin", label: "School administrator: manages the school" },
    { value: "counselor", label: "Guidance counselor: reviews alerts and makes reports" },
    { value: "staff", label: "Teacher: gets alerts for their classroom" },
  ]);
});

for (const { value: role } of NEW_USER_ROLE_OPTIONS) {
  test(`a super admin inside a school creates a ${role} for that school, never a super admin`, () => {
    assert.deepEqual(buildNewUserPayload(form(role), true), {
      payload: {
        email: `${role}@johnhopkins.test`,
        password: "Temporary123",
        role,
        is_super_admin: false,
        school_id: JOHN_HOPKINS,
      },
    });
  });

  test(`a school admin creates a ${role} without naming a school`, () => {
    assert.deepEqual(buildNewUserPayload(form(role, ""), false), {
      payload: {
        email: `${role}@johnhopkins.test`,
        password: "Temporary123",
        role,
        is_super_admin: false,
      },
    });
  });
}

test("a super admin outside a school cannot add people", () => {
  assert.ok("error" in buildNewUserPayload(form("admin", ""), true));
});

test("extra form fields can never turn Add person into a super-admin creation", () => {
  const built = buildNewUserPayload({ ...form("admin"), superAdmin: true, is_super_admin: true }, true);
  assert.equal(built.payload.is_super_admin, false);
  assert.equal(built.payload.school_id, JOHN_HOPKINS);
});

test("the People page has no Platform administrator option and lists the shared roles", async () => {
  const source = await readFile(new URL("../app/(app)/people/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Platform administrator<|type="checkbox"|setNewSuperAdmin/);
  assert.match(source, /NEW_USER_ROLE_OPTIONS\.map/);
  assert.match(source, /schoolId: scope\?\.id \?\? ""/);
});

test("the principal (school admin) sees only John Hopkins' 7 school pages", () => {
  const principal = { role: "admin", is_super_admin: false };
  const role = accessRoleOf(principal);
  assert.equal(role, "admin");
  for (const mode of ["school", "platform"]) {
    const items = navItemsFor(role, mode);
    assert.deepEqual(
      items.map((item) => item.label),
      ["Overview", "Alerts", "Reports", "Classrooms", "People", "Activity", "Settings"]
    );
    for (const label of ["All schools", "Monitored words", "Detection settings", "Platform activity"]) {
      assert.ok(!items.some((item) => item.label === label), label);
    }
  }
  assert.equal(canAccessPath(role, "/schools"), false);
});
