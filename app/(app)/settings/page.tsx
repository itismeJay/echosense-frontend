"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { getSettings, saveSettings } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setSettings(await getSettings());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSettings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) =>
      current ? { ...current, [key]: value } : current
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      setSettings(await saveSettings(settings));
      toast.success("System settings saved.");
    } catch {
      toast.error("We couldn’t save the settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Administrator
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
          System Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Manage the existing classroom alert settings. Changes are saved to the
          current monitoring system.
        </p>
      </header>

      {loading ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Loading system settings</span>
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : loadError || !settings ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h2 className="font-bold text-red-950 dark:text-red-100">
            We couldn&apos;t load system settings.
          </h2>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            No default values are being shown because the current backend values
            could not be verified.
          </p>
          <button
            type="button"
            onClick={() => void loadSettings()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <section
            aria-labelledby="sensitivity-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <label
                    id="sensitivity-title"
                    htmlFor="alert-sensitivity"
                    className="font-bold text-slate-950 dark:text-white"
                  >
                    Alert Sensitivity
                  </label>
                  <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {settings.confidence_threshold_percent}%
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Minimum detection strength required before an alert is created.
                </p>
              </div>
            </div>
            <input
              id="alert-sensitivity"
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.confidence_threshold_percent}
              onChange={(event) =>
                update(
                  "confidence_threshold_percent",
                  Number(event.target.value)
                )
              }
              className="mt-5 h-11 w-full cursor-pointer accent-indigo-700"
            />
          </section>

          <section
            aria-labelledby="duration-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <label
                    id="duration-title"
                    htmlFor="minimum-alert-duration"
                    className="font-bold text-slate-950 dark:text-white"
                  >
                    Minimum Alert Duration
                  </label>
                  <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
                    {settings.aggression_duration_threshold.toFixed(1)}s
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Minimum sound duration required before an alert is created.
                </p>
              </div>
            </div>
            <input
              id="minimum-alert-duration"
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={settings.aggression_duration_threshold}
              onChange={(event) =>
                update(
                  "aggression_duration_threshold",
                  Number(event.target.value)
                )
              }
              className="mt-5 h-11 w-full cursor-pointer accent-violet-700"
            />
          </section>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            aria-busy={saving}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
