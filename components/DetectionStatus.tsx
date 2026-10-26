"use client";

import type { Alert } from "@/lib/types";
import { formatConfidence, formatTimestamp } from "@/lib/format";
import SeverityBadge from "./SeverityBadge";
import { Mic, AlertTriangle, MapPin, Clock, Timer } from "lucide-react";

interface DetectionStatusProps {
  state: "listening" | "detected";
  latest?: Alert;
}

export default function DetectionStatus({
  state,
  latest,
}: DetectionStatusProps) {
  const isDetected = state === "detected";

  return (
    <div
      className={`relative overflow-hidden rounded-panel border p-6 transition-all duration-700 ${
        isDetected
          ? "bg-red-500/10 border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)]"
          : "bg-bg dark:bg-indigo-500/[0.03] border-white/80  shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(99,102,241,0.08)]"
      }`}
    >
      {/* Background glow */}
      <div
        className={`absolute inset-0 opacity-30 pointer-events-none ${
          isDetected
            ? "bg-gradient-to-br from-red-900/60 via-transparent to-transparent"
            : "bg-gradient-to-br from-indigo-900/20  via-transparent to-transparent"
        }`}
      />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {isDetected ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-red-400 font-semibold">
                    Waiting for Attention
                  </span>
                </div>
                <h2 className="text-2xl font-black text-danger leading-tight">
                  Possible Aggression Alert
                </h2>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-5 h-5 text-link" />
                  <span className="text-xs text-link font-semibold">
                    Monitoring Active
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-ink leading-tight">
                  Monitoring Active
                </h2>
              </>
            )}
          </div>
          {latest && <SeverityBadge severity={latest.severity} dot />}
        </div>

        {/* Detected details */}
        {isDetected && latest && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2 text-sm text-ink">
              <MapPin className="w-4 h-4 text-muted shrink-0" />
              <span>{latest.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock className="w-4 h-4 text-muted shrink-0" />
              <span>{formatTimestamp(latest.created_at)}</span>
            </div>
            <div className="flex items-center gap-4 text-sm mt-1">
              <span className="text-muted">
                Detection Confidence:{" "}
                <span className="text-red-500 dark:text-red-300 font-semibold">
                  {latest.confidence != null ? formatConfidence(latest.confidence) : "Unavailable"}
                </span>
              </span>
              <span className="text-muted">
                Duration:{" "}
                <span className="text-red-500 dark:text-red-300 font-semibold">
                  {latest.duration != null ? `${latest.duration.toFixed(1)}s` : "Unavailable"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Listening state */}
        {!isDetected && (
          <p className="text-sm text-muted mt-1">
            No recent high-priority possible alert is shown.
          </p>
        )}

        {/* Last detection info when listening */}
        {!isDetected && latest && (
          <div className="mt-4 p-3 bg-bg rounded-control border border-line">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="w-3.5 h-3.5 text-muted" />
              <p className="text-xs text-muted">Last Alert</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={latest.severity} />
              <span className="text-xs text-muted">
                {formatTimestamp(latest.created_at)}
              </span>
              <span className="text-xs text-muted">
                · {latest.confidence != null ? formatConfidence(latest.confidence) : "Confidence unavailable"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
