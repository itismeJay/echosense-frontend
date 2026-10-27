"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { Note, Panel } from "@/components/ui";
import { PUSH_LEVEL_OPTIONS, describeSchoolHours, togglePushLevel, type PushLevel } from "@/lib/school-settings";
import { SettingsLoadError, SettingsLoading, Switch, useSchoolSettings } from "./shared";

export default function NotificationsSettings() {
  const { settings, loadError, load, save } = useSchoolSettings();
  const [pending, setPending] = useState<PushLevel | null>(null);

  if (loadError) return <SettingsLoadError onRetry={() => void load()} />;
  if (!settings) return <SettingsLoading />;

  const toggle = async (level: PushLevel, on: boolean) => {
    setPending(level);
    const label = level.charAt(0) + level.slice(1).toLowerCase();
    await save(
      { push_levels: togglePushLevel(settings.push_levels, level, on) },
      on ? `Phone alerts turned on for ${label}` : `Phone alerts turned off for ${label}`
    );
    setPending(null);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Panel
        title="Phone alerts"
        description="Which alerts wake the phones of this school's staff. Every alert still appears on the dashboard."
        bodyClassName="divide-y divide-line px-4 py-4 sm:px-5"
      >
        {PUSH_LEVEL_OPTIONS.map((option) => (
          <Switch
            key={option.value}
            id={`push-${option.value.toLowerCase()}`}
            label={option.label}
            hint={option.hint}
            checked={settings.push_levels.includes(option.value)}
            disabled={pending !== null}
            onChange={(on) => void toggle(option.value, on)}
          />
        ))}
      </Panel>
      {settings.push_levels.length === 0 && (
        <Note icon={BellOff}>No phone alerts will be sent. Staff must check the dashboard to see new alerts.</Note>
      )}
      <p className="text-body text-muted">
        {settings.school_hours.enabled
          ? `School hours: ${describeSchoolHours(settings.school_hours)}. Outside these hours alerts are saved but no phone alert is sent.`
          : "School hours are off, so phone alerts can be sent at any time."}{" "}
        <Link href="/settings/hours" className="text-link underline">
          Change school hours
        </Link>
      </p>
    </div>
  );
}
