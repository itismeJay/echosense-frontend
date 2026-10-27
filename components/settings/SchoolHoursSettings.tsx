"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button, Field, FormError, Panel, inputClass } from "@/components/ui";
import {
  WEEKDAY_OPTIONS,
  describeSchoolHours,
  sameSchoolHours,
  schoolHoursProblem,
  type SchoolHours,
} from "@/lib/school-settings";
import { SettingsLoadError, SettingsLoading, Switch, useSchoolSettings } from "./shared";

function HoursForm({
  saved,
  onSave,
}: {
  saved: SchoolHours;
  onSave: (hours: SchoolHours) => Promise<boolean>;
}) {
  const [hours, setHours] = useState<SchoolHours>(saved);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changed = !sameSchoolHours(hours, saved);

  const update = (next: Partial<SchoolHours>) => {
    setHours((current) => ({ ...current, ...next }));
    setProblem(null);
  };

  const toggleDay = (day: number, on: boolean) =>
    update({
      weekdays: on
        ? [...new Set([...hours.weekdays, day])].sort((a, b) => a - b)
        : hours.weekdays.filter((item) => item !== day),
    });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = schoolHoursProblem(hours);
    if (found) {
      setProblem(found);
      return;
    }
    setSaving(true);
    await onSave(hours);
    setSaving(false);
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="max-w-2xl space-y-4">
      <Panel
        title="School hours"
        description="Outside these hours alerts are still saved and shown on the dashboard, but no phone alert is sent. They are marked “Outside school hours”."
        bodyClassName="space-y-5 px-4 py-4 sm:px-5"
      >
        <Switch
          id="school-hours-enabled"
          label="Only send phone alerts during school hours"
          hint="When this is off, phone alerts can be sent at any time."
          checked={hours.enabled}
          onChange={(enabled) => update({ enabled })}
        />
        <fieldset disabled={!hours.enabled} className="space-y-5 disabled:opacity-60">
          <div>
            <legend className="text-body font-medium text-ink">School days</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((day) => {
                const on = hours.weekdays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-body ${
                      on ? "border-ink text-ink" : "border-line-strong text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(event) => toggleDay(day.value, event.target.checked)}
                      className="h-4 w-4"
                    />
                    <span aria-hidden="true">{day.short}</span>
                    <span className="sr-only">{day.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="school-start" label="Starts at">
              <input
                id="school-start"
                type="time"
                value={hours.start}
                onChange={(event) => update({ start: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field id="school-end" label="Ends at" hint="An end time before the start time runs past midnight.">
              <input
                id="school-end"
                type="time"
                value={hours.end}
                onChange={(event) => update({ end: event.target.value })}
                aria-describedby="school-end-hint"
                className={inputClass}
              />
            </Field>
          </div>
          <p className="text-small text-muted">Times are in Philippine time ({hours.timezone}).</p>
        </fieldset>
      </Panel>
      {problem && <FormError>{problem}</FormError>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" icon={Save} pending={saving} disabled={!changed}>
          Save school hours
        </Button>
        <span className="text-body text-muted">
          {changed ? "You have unsaved changes." : `Now: ${describeSchoolHours(saved)}`}
        </span>
      </div>
    </form>
  );
}

export default function SchoolHoursSettings() {
  const { settings, loadError, load, save } = useSchoolSettings();

  if (loadError) return <SettingsLoadError onRetry={() => void load()} />;
  if (!settings) return <SettingsLoading />;
  return (
    <HoursForm
      // Re-seed the form from the server's values after each save.
      key={settings.updated_at ?? "initial"}
      saved={settings.school_hours}
      onSave={(school_hours) => save({ school_hours }, "School hours saved")}
    />
  );
}
