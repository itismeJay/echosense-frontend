import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CHANGE_PASSWORD_PATH,
  SCHOOL_INACTIVE_MESSAGE,
  classifyForbiddenDetail,
  handleForbiddenDetail,
  loginNoticeMessage,
} from "../lib/session-errors.ts";
import { decideProxy } from "../lib/access.ts";
import { newPasswordProblem } from "../lib/password-policy.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

function fakeEnvironment(pathname = "/dashboard") {
  const calls = { cleared: 0, flag: [], navigated: [] };
  return {
    calls,
    environment: {
      pathname,
      clearToken: () => {
        calls.cleared += 1;
      },
      setPasswordChangeFlag: (value) => calls.flag.push(value),
      navigate: (destination) => calls.navigated.push(destination),
    },
  };
}

test("classifies the backend account-state 403 details exactly", () => {
  assert.equal(classifyForbiddenDetail("password_change_required"), "password_change_required");
  assert.equal(classifyForbiddenDetail("school_inactive"), "school_inactive");
  assert.equal(classifyForbiddenDetail("Super-admin access required"), "no_permission");
  assert.equal(classifyForbiddenDetail(undefined), "no_permission");
  assert.equal(classifyForbiddenDetail({ detail: "school_inactive" }), "no_permission");
});

test("password_change_required sends the user to /change-password and keeps the token", () => {
  const { calls, environment } = fakeEnvironment("/alerts");

  assert.equal(handleForbiddenDetail("password_change_required", environment), "password_change_required");
  assert.deepEqual(calls, { cleared: 0, flag: [true], navigated: [CHANGE_PASSWORD_PATH] });
});

test("password_change_required does not reload /change-password itself", () => {
  const { calls, environment } = fakeEnvironment(CHANGE_PASSWORD_PATH);

  handleForbiddenDetail("password_change_required", environment);
  assert.deepEqual(calls.navigated, []);
});

test("school_inactive clears the session and shows the deactivation notice on /login", () => {
  const { calls, environment } = fakeEnvironment("/dashboard");

  assert.equal(handleForbiddenDetail("school_inactive", environment), "school_inactive");
  assert.equal(calls.cleared, 1);
  assert.deepEqual(calls.flag, [false]);
  assert.deepEqual(calls.navigated, ["/login?notice=school_inactive"]);
  assert.equal(loginNoticeMessage("?notice=school_inactive"), SCHOOL_INACTIVE_MESSAGE);
  assert.equal(
    SCHOOL_INACTIVE_MESSAGE,
    "Your school has been deactivated. Contact your administrator."
  );
});

test("other 403s change nothing and keep the existing permission message", async () => {
  const { calls, environment } = fakeEnvironment();

  assert.equal(handleForbiddenDetail("School access denied", environment), "no_permission");
  assert.deepEqual(calls, { cleared: 0, flag: [], navigated: [] });
  assert.equal(loginNoticeMessage("?notice=anything-else"), null);
  const api = await readSource("lib/api.ts");
  assert.match(api, /You do not have permission to perform this action\./);
});

test("proxy forces /change-password on every page while the flag cookie is set", () => {
  for (const pathname of ["/dashboard", "/alerts", "/users", "/profile", "/admin/schools"]) {
    assert.deepEqual(
      decideProxy({ pathname, jwtRole: "staff", hadToken: true, mustChangePassword: true }),
      { kind: "redirect", to: "/change-password", clearToken: false },
      pathname
    );
  }
  assert.deepEqual(
    decideProxy({ pathname: "/change-password", jwtRole: "staff", hadToken: true, mustChangePassword: true }),
    { kind: "next", clearToken: false }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/login", jwtRole: "staff", hadToken: true, mustChangePassword: true }),
    { kind: "redirect", to: "/change-password", clearToken: false }
  );
});

test("proxy still sends signed-out users to /login, even with a stale flag", () => {
  assert.deepEqual(
    decideProxy({ pathname: "/change-password", jwtRole: null, hadToken: false, mustChangePassword: true }),
    { kind: "redirect", to: "/login", clearToken: true }
  );
  assert.deepEqual(
    decideProxy({ pathname: "/login", jwtRole: null, hadToken: true, mustChangePassword: false }),
    { kind: "next", clearToken: true }
  );
});

test("client code applies the forced change too, not only the proxy", async () => {
  const [layout, auth, login, proxy] = await Promise.all([
    readSource("app/(app)/layout.tsx"),
    readSource("lib/auth.ts"),
    readSource("app/login/page.tsx"),
    readSource("proxy.ts"),
  ]);
  assert.match(layout, /if \(mustChangePassword\) router\.replace\(CHANGE_PASSWORD_PATH\)/);
  assert.match(auth, /setPasswordChangeFlag\(user\.must_change_password\)/);
  assert.match(auth, /data\.must_change_password === true/);
  assert.match(login, /user\.must_change_password \? CHANGE_PASSWORD_PATH : homePathFor\(accessRoleOf\(user\)\)/);
  assert.match(proxy, /"\/change-password"/);
  assert.match(proxy, /PASSWORD_CHANGE_COOKIE/);
});

test("change-password page refreshes /auth/me and then opens that role's home", async () => {
  const page = await readSource("app/change-password/page.tsx");
  assert.match(page, /await refreshCurrentUser\(\)/);
  assert.match(page, /router\.replace\(homePathFor\(accessRoleOf\(refreshed\)\)\)/);
  // Change password lives on its own page, reached from the avatar menu and Profile.
  const [profile, topBar] = await Promise.all([
    readSource("app/(app)/profile/page.tsx"),
    readSource("components/TopBar.tsx"),
  ]);
  assert.match(profile, /href="\/change-password"/);
  assert.match(topBar, /href: "\/change-password"/);
  assert.match(page, /<ChangePasswordForm/);
});

test("new password rules match the backend", () => {
  const ok = { currentPassword: "temporary-1", newPassword: "brand-new-pass", confirmPassword: "brand-new-pass" };
  assert.equal(newPasswordProblem(ok), null);
  assert.match(newPasswordProblem({ ...ok, newPassword: "short", confirmPassword: "short" }), /at least 8/);
  assert.match(newPasswordProblem({ ...ok, newPassword: "temporary-1", confirmPassword: "temporary-1" }), /different/);
  assert.match(newPasswordProblem({ ...ok, confirmPassword: "brand-new-pasS" }), /do not match/);
  assert.match(newPasswordProblem({ ...ok, newPassword: "é".repeat(37), confirmPassword: "é".repeat(37) }), /72 bytes/);
});
