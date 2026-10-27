"use client";

import { useCallback, useEffect, useState } from "react";
import { Detail, ErrorState, Panel, Skeleton } from "@/components/ui";
import { getSystemSettings } from "@/lib/api";
import type { SystemSettings } from "@/lib/types";

/** Read-only facts about the detection engine. Nothing here is adjustable. */
export default function DetectionInfo() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      setSettings(await getSystemSettings());
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loadError) {
    return (
      <div className="max-w-2xl">
        <ErrorState title="Detection settings couldn't be loaded" onRetry={() => void load()}>
          Check the internet connection, then try again.
        </ErrorState>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Panel title="How detection works">
        <ol className="list-decimal space-y-2 pl-5 text-body text-ink">
          <li>The classroom device listens for loud or aggressive sound.</li>
          <li>It transcribes the speech and checks it against the school&apos;s monitored words.</li>
          <li>A match creates an alert for a person to review.</li>
        </ol>
      </Panel>

      <Panel title="Detection models" description="Installed on the classroom devices. Shown for reference.">
        {settings ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Speech recognition model">{settings.stt_model_version}</Detail>
            <Detail label="Sound detection model">{settings.yamnet_version}</Detail>
          </dl>
        ) : (
          <div role="status">
            <span className="sr-only">Loading detection models</span>
            <Skeleton className="h-12" />
          </div>
        )}
      </Panel>

      <Panel title="What each school controls">
        <ul className="list-disc space-y-1.5 pl-5 text-body text-ink">
          <li>Which alert levels send phone alerts</li>
          <li>School hours, outside which no phone alert is sent</li>
          <li>Sensitivity: Normal or Strict</li>
          <li>Turning words on this list off, and adding its own words</li>
        </ul>
        <p className="mt-3 text-body text-muted">Enter a school from All schools to change its settings.</p>
      </Panel>
    </div>
  );
}
