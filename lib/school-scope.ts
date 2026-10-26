"use client";

// The school a super admin has entered ("Enter a school"). Remembered across reloads
// until Exit, and cleared on login, logout and any session reset. Only super admins
// ever set it; the backend still rejects a foreign school_id from anyone else.

import { useSyncExternalStore } from "react";

export const SCHOOL_SCOPE_KEY = "echosense.schoolScope.v1";

export interface SchoolScope {
  id: string;
  name: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseSchoolScope(raw: string | null): SchoolScope | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== "object" || value === null) return null;
    const { id, name } = value as Record<string, unknown>;
    if (typeof id !== "string" || !UUID_PATTERN.test(id)) return null;
    if (typeof name !== "string" || !name.trim()) return null;
    return { id, name: name.trim() };
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedScope: SchoolScope | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SCHOOL_SCOPE_KEY);
  } catch {
    return null;
  }
}

export function getSchoolScope(): SchoolScope | null {
  if (typeof window === "undefined") return null;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedScope = parseSchoolScope(raw);
  }
  return cachedScope;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function enterSchool(scope: SchoolScope) {
  try {
    window.localStorage.setItem(SCHOOL_SCOPE_KEY, JSON.stringify(scope));
  } catch {
    // Storage blocked: the scope lasts for this page only.
    cachedRaw = JSON.stringify(scope);
    cachedScope = scope;
  }
  notify();
}

export function clearSchoolScope() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SCHOOL_SCOPE_KEY);
  } catch {
    // Nothing stored.
  }
  cachedRaw = undefined;
  cachedScope = null;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCHOOL_SCOPE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSchoolScope(): SchoolScope | null {
  return useSyncExternalStore(subscribe, getSchoolScope, () => null);
}

/** Adds school_id to an API path when a super admin is inside a school. */
export function withSchoolScope(path: string, scope: SchoolScope | null): string {
  if (!scope) return path;
  const [base, hash] = path.split("#", 2);
  const separator = base.includes("?") ? "&" : "?";
  if (/[?&]school_id=/.test(base)) return path;
  return `${base}${separator}school_id=${encodeURIComponent(scope.id)}${hash ? `#${hash}` : ""}`;
}
