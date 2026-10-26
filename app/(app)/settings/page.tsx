"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { Button, Detail, ErrorState, Panel, Skeleton } from "@/components/ui";
import { getSystemSettings, saveSettings } from "@/lib/api";
import { canEditGlobalConfig } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { systemSettingsToForm } from "@/lib/settings";
import type { Settings, SystemSettings } from "@/lib/types";

function Slider({
  id,
  label,
  help,
  value,
  display,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-body-lg font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="num text-title font-semibold text-ink">
          {display}
        </output>
      </div>
      <p id={`${id}-help`} className="mt-0.5 text-body text-muted">
        {help}
      </p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={`${id}-help`}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-11 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

export default function DetectionSettingsPage() {
  const currentUser = useCurrentUser();
  // Only super admins may change the global values (the backend returns 403 to everyone else).
  const canEdit = canEditGlobalConfig(currentUser);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState<Settings | null>(null);
  const [models, setModels] = useState<Pick<SystemSettings, "stt_model_version" | "yamnet_version"> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoadError(false);
    try {
      const current = await getSystemSettings();
      const form = systemSettingsToForm(current);
      setSettings(form);
      setSaved(form);
      setModels({ stt_model_version: current.stt_model_version, yamnet_version: current.yamnet_version });
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => void loadSettings(), 0);
    return () => clearTimeout(timer);
  }, [currentUser, loadSettings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!canEdit) return;
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSave = async () => {
    if (!settings || !canEdit) return;
    setSaving(true);
    try {
      const next = await saveSettings(settings);
      setSettings(next);
      setSaved(next);
      toast.success("Settings saved");
    } catch (caught) {
      toast.error(caught instanceof Error ? `${caught.message} The settings were not saved.` : "The settings were not saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="max-w-2xl">
        <ErrorState title="Settings couldn't be loaded" onRetry={() => void loadSettings()}>
          No values are shown until EchoSense confirms the current ones. Check the internet connection, then try again.
        </ErrorState>
      </div>
    );
  }
  if (!settings || !models) {
    return (
      <div role="status" className="max-w-2xl space-y-3">
        <span className="sr-only">Loading settings</span>
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const changed =
    saved !== null &&
    (saved.confidence_threshold_percent !== settings.confidence_threshold_percent ||
      saved.aggression_duration_threshold !== settings.aggression_duration_threshold);

  return (
    <div className="max-w-2xl space-y-4">
      <Panel title="When to create an alert" bodyClassName="divide-y divide-line px-4 py-4 sm:px-5">
        <Slider
          id="alert-sensitivity"
          label="Alert sensitivity"
          help="How sure the device must be before it creates an alert. Higher means fewer, more certain alerts."
          value={settings.confidence_threshold_percent}
          display={`${settings.confidence_threshold_percent}%`}
          min={0}
          max={100}
          step={1}
          disabled={!canEdit}
          onChange={(value) => update("confidence_threshold_percent", value)}
        />
        <Slider
          id="minimum-alert-duration"
          label="Minimum sound length"
          help="How long a loud sound must last before it counts."
          value={settings.aggression_duration_threshold}
          display={`${settings.aggression_duration_threshold.toFixed(1)} seconds`}
          min={1}
          max={10}
          step={0.5}
          disabled={!canEdit}
          onChange={(value) => update("aggression_duration_threshold", value)}
        />
      </Panel>

      <Panel title="Detection models" description="Set on the classroom devices. Shown here for reference.">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Speech recognition model">{models.stt_model_version}</Detail>
          <Detail label="Sound detection model">{models.yamnet_version}</Detail>
        </dl>
      </Panel>

      {canEdit && (
        <div className="flex items-center gap-3">
          <Button variant="primary" icon={Save} pending={saving} disabled={!changed} onClick={() => void handleSave()}>
            Save settings
          </Button>
          {changed && <span className="text-body text-muted">You have unsaved changes.</span>}
        </div>
      )}
    </div>
  );
}
