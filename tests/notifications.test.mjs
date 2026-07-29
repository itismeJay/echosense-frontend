import test from "node:test";
import assert from "node:assert/strict";
import {
  parseNotificationPreference,
  shouldShowBrowserNotification,
} from "../lib/notifications.ts";

test("notification preference is enabled only by an explicit true value", () => {
  assert.equal(parseNotificationPreference("true"), true);
  assert.equal(parseNotificationPreference("false"), false);
  assert.equal(parseNotificationPreference(null), false);
  assert.equal(parseNotificationPreference("1"), false);
});

test("browser notifications require preference, permission, and high priority", () => {
  assert.equal(
    shouldShowBrowserNotification({
      enabled: true,
      permission: "granted",
      severity: "high",
    }),
    true
  );
  assert.equal(
    shouldShowBrowserNotification({
      enabled: false,
      permission: "granted",
      severity: "high",
    }),
    false
  );
  assert.equal(
    shouldShowBrowserNotification({
      enabled: true,
      permission: "denied",
      severity: "high",
    }),
    false
  );
  assert.equal(
    shouldShowBrowserNotification({
      enabled: true,
      permission: "granted",
      severity: "medium",
    }),
    false
  );
});
