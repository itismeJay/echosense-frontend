"use client";

import { useState } from "react";
import { Panel } from "@/components/ui";
import { SENSITIVITY_OPTIONS, type Sensitivity } from "@/lib/school-settings";
import { SettingsLoadError, SettingsLoading, useSchoolSettings } from "./shared";

export default function SensitivitySettings() {
  const { settings, loadError, load, save } = useSchoolSettings();
  const [pending, setPending] = useState(false);

  if (loadError) return <SettingsLoadError onRetry={() => void load()} />;
  if (!settings) return <SettingsLoading />;

  const choose = async (sensitivity: Sensitivity) => {
    if (sensitivity === settings.sensitivity) return;
    setPending(true);
    const label = SENSITIVITY_OPTIONS.find((option) => option.value === sensitivity)?.label ?? sensitivity;
    await save({ sensitivity }, `Sensitivity set to ${label}`);
    setPending(false);
  };

  return (
    <div className="max-w-2xl">
      <Panel
        title="Sensitivity"
        description="How readily this school's classroom devices raise an alert. It applies to every classroom in the school."
        bodyClassName="px-4 py-4 sm:px-5"
      >
        <fieldset disabled={pending} className="grid gap-3">
          <legend className="sr-only">Sensitivity</legend>
          {SENSITIVITY_OPTIONS.map((option) => {
            const selected = settings.sensitivity === option.value;
            return (
              <label
                key={option.value}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-control border p-3 ${
                  selected ? "border-ink" : "border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="sensitivity"
                  value={option.value}
                  checked={selected}
                  onChange={() => void choose(option.value)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-body font-medium text-ink">{option.label}</span>
                  <span className="block text-body text-muted">{option.explanation}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </Panel>
    </div>
  );
}
