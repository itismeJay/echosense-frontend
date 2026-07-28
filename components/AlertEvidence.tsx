"use client";

import { useState } from "react";
import {
  Activity,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Info,
  Quote,
  Tags,
  Volume2,
  Waves,
} from "lucide-react";
import type { Alert } from "@/lib/types";
import {
  matchedTermEvidenceLabel,
  NO_MATCHED_TERMS_MESSAGE,
  UNVERIFIED_EVIDENCE_NOTICE,
} from "@/lib/alert-presentation";
import {
  categoryBadgeColor,
  categoryLabel,
  emotionBadgeColor,
  formatLanguageConfidence,
} from "@/lib/format";
import DurationGateBadge from "./DurationGateBadge";
import LanguageBadge from "./LanguageBadge";
import WaveformDisplay from "./WaveformDisplay";

interface AlertEvidenceProps {
  alert: Alert;
  defaultExpanded?: boolean;
  hideToggle?: boolean;
}

function MetricBar({
  label,
  value,
  display,
  barClass,
  icon: Icon,
}: {
  label: string;
  value: number;
  display: string;
  barClass: string;
  icon: typeof Volume2;
}) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{display}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AlertEvidence({
  alert,
  defaultExpanded = false,
  hideToggle = false,
}: AlertEvidenceProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const isOpen = hideToggle || open;

  const hardHits = alert.hard_hits ?? [];
  const softHits = alert.soft_hits ?? [];
  const fallbackWords =
    hardHits.length === 0 && softHits.length === 0
      ? alert.detected_words ?? []
      : [];
  const categories = alert.categories ?? [];
  const matchedTerms = alert.matched_terms ?? [];
  const waveform = alert.waveform_snapshot ?? [];
  const languageConfidence = formatLanguageConfidence(
    alert.language_confidence
  );

  return (
    <div>
      {!hideToggle && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={isOpen}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isOpen ? "Hide Details" : "View Details"}
        </button>
      )}

      {isOpen && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <section aria-labelledby={`phrase-${alert.id}`}>
            <h2 id={`phrase-${alert.id}`} className="text-base font-semibold text-slate-950 dark:text-white">
              Possible Detected Phrase
            </h2>
            {alert.transcribed_text ? (
              <div className="mt-3 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/30">
                <Quote className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                <p className="text-sm italic leading-6 text-slate-800 dark:text-slate-100">
                  &ldquo;{alert.transcribed_text}&rdquo;
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                No possible phrase was included with this alert.
              </p>
            )}
            <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Automatic transcription may be inaccurate because of overlapping voices or background noise.
              </p>
            </div>
          </section>

          <section aria-labelledby={`matched-terms-${alert.id}`}>
            <h2
              id={`matched-terms-${alert.id}`}
              className="text-base font-semibold text-slate-950 dark:text-white"
            >
              Possible Detected Terms
            </h2>
            {matchedTerms.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {matchedTerms.map((matchedTerm, index) => (
                  <li
                    key={`${matchedTerm.term_id}-${matchedTerm.match_type}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50"
                  >
                    <div className="flex items-start gap-3">
                      <Tags
                        className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {matchedTermEvidenceLabel(matchedTerm.match_type)}
                        </p>
                        <p className="mt-1 break-words font-semibold text-slate-950 dark:text-white">
                          {matchedTerm.term}
                        </p>
                        <div className="mt-2">
                          <LanguageBadge
                            language={matchedTerm.language}
                            size="md"
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {NO_MATCHED_TERMS_MESSAGE}
              </p>
            )}
            <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              <Info
                className="mt-1 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>{UNVERIFIED_EVIDENCE_NOTICE}</p>
            </div>
          </section>

          {(hardHits.length > 0 || softHits.length > 0 || fallbackWords.length > 0) && (
            <section aria-labelledby={`terms-${alert.id}`}>
              <h2 id={`terms-${alert.id}`} className="text-base font-semibold text-slate-950 dark:text-white">
                Words the system may have detected
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {hardHits.map((word, index) => (
                  <span key={`hard-${word}-${index}`} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
                    {word}
                  </span>
                ))}
                {softHits.map((word, index) => (
                  <span key={`soft-${word}-${index}`} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100">
                    {word}
                  </span>
                ))}
                {fallbackWords.map((word, index) => (
                  <span key={`word-${word}-${index}`} className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {word}
                  </span>
                ))}
              </div>
            </section>
          )}

          {categories.length > 0 && (
            <section aria-labelledby={`categories-${alert.id}`}>
              <h2 id={`categories-${alert.id}`} className="text-base font-semibold text-slate-950 dark:text-white">
                Possible Concern Category
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span key={category} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${categoryBadgeColor(category)}`}>
                    {categoryLabel(category)}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby={`language-${alert.id}`}>
            <h2 id={`language-${alert.id}`} className="text-base font-semibold text-slate-950 dark:text-white">
              Language
            </h2>
            <div className="mt-3">
              <LanguageBadge language={alert.language} size="md" />
            </div>
            {languageConfidence && (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="font-medium">Language confidence:</span>{" "}
                {languageConfidence}
              </p>
            )}
          </section>

          <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-100">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Technical Details
            </summary>

            <div className="mt-4 space-y-5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                  <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Detection Confidence: {Math.round(alert.confidence * 100)}%
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Duration: {alert.duration.toFixed(1)}s
                </span>
                {alert.duration_gate && <DurationGateBadge gate={alert.duration_gate} size="md" />}
              </div>

              {(alert.emotion || alert.yamnet_class) && (
                <div className="flex flex-wrap gap-2">
                  {alert.emotion && (
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase ${emotionBadgeColor(alert.emotion)}`}>
                      Possible vocal tone: {alert.emotion}
                    </span>
                  )}
                  {alert.yamnet_class && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100">
                      <Waves className="h-3.5 w-3.5" aria-hidden="true" />
                      Sound Detection Model: {alert.yamnet_class}
                      {alert.yamnet_score != null && ` (${alert.yamnet_score.toFixed(2)})`}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {alert.rms != null && (
                  <MetricBar label="Volume measurement (RMS)" value={(alert.rms / 3000) * 100} display={Math.round(alert.rms).toString()} barClass="bg-indigo-600" icon={Volume2} />
                )}
                {alert.zero_crossing_rate != null && (
                  <MetricBar label="Zero-crossing rate" value={(alert.zero_crossing_rate / 0.3) * 100} display={alert.zero_crossing_rate.toFixed(3)} barClass="bg-purple-600" icon={Activity} />
                )}
                {alert.energy_variance != null && (
                  <MetricBar label="Energy variance" value={(alert.energy_variance / 15000) * 100} display={Math.round(alert.energy_variance).toString()} barClass="bg-cyan-600" icon={Activity} />
                )}
              </div>

              {alert.peak_to_average != null && (
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Peak-to-average ratio</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{alert.peak_to_average.toFixed(4)}</span>
                </div>
              )}

              {waveform.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Waveform snapshot</p>
                  <WaveformDisplay
                    snapshot={waveform}
                    emotion={alert.emotion ?? undefined}
                  />
                </div>
              )}

              <p className="flex gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Technical measurements are supporting signals only. They do not confirm that an incident occurred.
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
