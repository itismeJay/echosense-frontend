"use client";

import { useState } from "react";
import type { Alert } from "@/lib/types";
import { formatConfidence } from "@/lib/format";
import { X, ShieldAlert } from "lucide-react";

interface AlertBannerProps {
  alert: Alert;
}

// Parent should pass key={alert.id} so the component remounts when a new alert arrives,
// naturally resetting the dismissed state without needing a useEffect.
export default function AlertBanner({ alert }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 rounded-2xl"
    >
      <div className="p-2 rounded-xl bg-red-500/15 dark:bg-red-500/20 shrink-0">
        <ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          Possible Aggression Alert — {alert.location}
        </p>
        <p className="text-xs text-red-500/70 dark:text-red-400/70 mt-0.5">
          Detection Confidence: {formatConfidence(alert.confidence)} · Duration:{" "}
          {alert.duration.toFixed(1)}s
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
        aria-label="Dismiss alert banner"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
