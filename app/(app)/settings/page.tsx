"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Cpu,
  Info,
  Loader2,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { getSystemSettings, saveSettings } from "@/lib/api";
import { canEditGlobalConfig } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { systemSettingsToForm } from "@/lib/settings";
import type { Settings, SystemSettings } from "@/lib/types";

export default function SettingsPage() {
  const currentUser = useCurrentUser();
  // The (app) page guard limits this page to administrators; only super admins may
  // change the global values (the backend returns 403 to everyone else).
  const canEdit = canEditGlobalConfig(currentUser);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<Pick<
    SystemSettings,
    "stt_model_version" | "yamnet_version"
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const current = await getSystemSettings();
      setSettings(systemSettingsToForm(current));
      setModels({
        stt_model_version: current.stt_model_version,
        yamnet_version: current.yamnet_version,
      });
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentUser, loadSettings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!canEdit) return;
    setSettings((current) =>
      current ? { ...current, [key]: value } : current
    );
  };

  const handleSave = async () => {
    if (!settings || !canEdit) return;
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

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          {canEdit ? "Super administrator" : "Administrator"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Classroom alert controls shared by every school. Browser notification
          preferences are on your Profile page.
        </p>
      </header>

      {!canEdit && currentUser && (
        <div
          role="note"
          className="mb-6 flex gap-3 rounded-control border border-line bg-surface p-4 text-sm leading-6 text-link"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            These settings are read-only for school administrators. Only a super
            administrator can change them.
          </p>
        </div>
      )}

      {loading ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Loading system settings</span>
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-panel border border-line bg-bg"
            />
          ))}
        </div>
      ) : loadError || !settings ? (
        <div
          role="alert"
          className="rounded-panel border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h2 className="font-semibold text-ink">
            We couldn&apos;t load system settings.
          </h2>
          <p className="mt-2 text-sm text-danger">
            No default values are being shown because the current backend values
            could not be verified.
          </p>
          <button
            type="button"
            onClick={() => void loadSettings()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <section
            aria-labelledby="sensitivity-title"
            className="rounded-panel border border-line bg-bg p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-control bg-surface p-2.5 text-link">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <label
                    id="sensitivity-title"
                    htmlFor="alert-sensitivity"
                    className="font-semibold text-ink"
                  >
                    Alert Sensitivity
                  </label>
                  <span className="text-lg font-semibold text-link">
                    {settings.confidence_threshold_percent}%
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">
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
              disabled={!canEdit}
              onChange={(event) =>
                update(
                  "confidence_threshold_percent",
                  Number(event.target.value)
                )
              }
              className="mt-5 h-11 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            />
          </section>

          <section
            aria-labelledby="duration-title"
            className="rounded-panel border border-line bg-bg p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-control bg-violet-50 p-2.5 text-violet-700">
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <label
                    id="duration-title"
                    htmlFor="minimum-alert-duration"
                    className="font-semibold text-ink"
                  >
                    Minimum Alert Duration
                  </label>
                  <span className="text-lg font-semibold text-violet-700">
                    {settings.aggression_duration_threshold.toFixed(1)}s
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">
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
              disabled={!canEdit}
              onChange={(event) =>
                update(
                  "aggression_duration_threshold",
                  Number(event.target.value)
                )
              }
              className="mt-5 h-11 w-full cursor-pointer accent-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </section>

          {models && (
            <section
              aria-labelledby="models-title"
              className="rounded-panel border border-line bg-bg p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-control bg-surface p-2.5 text-ink">
                  <Cpu className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 id="models-title" className="font-semibold text-ink">
                  Detection models
                </h2>
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-control bg-surface p-4">
                  <dt className="text-xs font-semibold text-muted">
                    Speech recognition model
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm text-ink">
                    {models.stt_model_version}
                  </dd>
                </div>
                <div className="rounded-control bg-surface p-4">
                  <dt className="text-xs font-semibold text-muted">
                    Sound detection model
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm text-ink">
                    {models.yamnet_version}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              aria-busy={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-5 py-3 font-semibold text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? "Saving…" : "Save Settings"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
