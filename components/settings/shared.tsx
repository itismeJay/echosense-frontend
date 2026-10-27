"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ErrorState, Skeleton } from "@/components/ui";
import { ApiError, getSchoolSettings, updateSchoolSettings } from "@/lib/api";
import { isSuperAdmin } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { useSchoolScope } from "@/lib/school-scope";
import {
  schoolSettingsErrorMessage,
  settingsModeFor,
  type SchoolSettings,
  type SchoolSettingsUpdate,
  type SettingsMode,
} from "@/lib/school-settings";

/** null until the signed-in user is known. */
export function useSettingsMode(): SettingsMode | null {
  const user = useCurrentUser();
  const scope = useSchoolScope();
  if (!user) return null;
  return settingsModeFor(isSuperAdmin(user), scope !== null);
}

export function errorText(caught: unknown): string {
  return caught instanceof ApiError
    ? schoolSettingsErrorMessage(caught.status, caught.message)
    : "The change wasn't saved. Try again.";
}

/** Loads this school's settings and saves partial updates with a toast. */
export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      setSettings(await getSchoolSettings());
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const save = useCallback(async (update: SchoolSettingsUpdate, success: string): Promise<boolean> => {
    try {
      setSettings(await updateSchoolSettings(update));
      toast.success(success);
      return true;
    } catch (caught) {
      toast.error(errorText(caught));
      return false;
    }
  }, []);

  return { settings, setSettings, loadError, load, save };
}

export function SettingsLoading({ label = "Loading settings" }: { label?: string }) {
  return (
    <div role="status" className="max-w-2xl space-y-3">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-40" />
    </div>
  );
}

export function SettingsLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-2xl">
      <ErrorState title="Settings couldn't be loaded" onRetry={onRetry}>
        Nothing is shown until EchoSense confirms this school&apos;s current settings. Check the internet connection,
        then try again.
      </ErrorState>
    </div>
  );
}

/** An on/off switch with a visible label; the state is announced as on or off. */
export function Switch({
  id,
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-body font-medium text-ink">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="mt-0.5 text-small text-muted">
            {hint}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "border-brand bg-brand" : "border-line-strong bg-surface"
        }`}
      >
        <span className="sr-only">{checked ? "On" : "Off"}</span>
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 rounded-full border border-line bg-bg transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
