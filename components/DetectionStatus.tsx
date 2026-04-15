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
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-700 ${
        isDetected
          ? "bg-red-500/10 border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)]"
          : "bg-white/60 dark:bg-indigo-500/[0.03] border-white/80 dark:border-indigo-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(99,102,241,0.08)]"
      }`}
    >
      {/* Background glow */}
      <div
        className={`absolute inset-0 opacity-30 pointer-events-none ${
          isDetected
            ? "bg-gradient-to-br from-red-900/60 via-transparent to-transparent"
            : "bg-gradient-to-br from-indigo-900/20 dark:from-indigo-900/40 via-transparent to-transparent"
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
                  <span className="text-xs text-red-400 font-semibold uppercase tracking-widest">
                    Alert Active
                  </span>
                </div>
                <h2 className="text-2xl font-black text-red-700 dark:text-red-200 leading-tight">
                  Aggression Detected
                </h2>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-widest">
                    Monitoring Active
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-indigo-200 leading-tight">
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
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <span>{latest.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <span>{formatTimestamp(latest.created_at)}</span>
            </div>
            <div className="flex items-center gap-4 text-sm mt-1">
              <span className="text-gray-400 dark:text-gray-500">
                Confidence:{" "}
                <span className="text-red-500 dark:text-red-300 font-bold">
                  {formatConfidence(latest.confidence)}
                </span>
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                Duration:{" "}
                <span className="text-red-500 dark:text-red-300 font-bold">
                  {latest.duration.toFixed(1)}s
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Listening state */}
        {!isDetected && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            No aggression detected in classroom. System is actively listening...
          </p>
        )}

        {/* Last detection info when listening */}
        {!isDetected && latest && (
          <div className="mt-4 p-3 bg-white/60 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">Last Detection</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={latest.severity} />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatTimestamp(latest.created_at)}
              </span>
              <span className="text-xs text-gray-300 dark:text-gray-600">
                · {formatConfidence(latest.confidence)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
