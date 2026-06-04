"use client";

import { useState } from "react";
import type { Alert } from "@/lib/types";
import { emotionBadgeColor, categoryBadgeColor, categoryLabel, languageLabel } from "@/lib/format";
import WaveformDisplay from "./WaveformDisplay";
import { ChevronDown, ChevronUp, Quote, Volume2, Activity, Waves, ShieldAlert, Clock, BarChart2 } from "lucide-react";

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
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{display}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div className={`h-1.5 rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PRIVACY_NOTE =
  "No audio recording stored. Text transcription and acoustic metadata only. Compliant with Data Privacy Act of 2012.";

export default function AlertEvidence({
  alert,
  defaultExpanded = false,
  hideToggle = false,
}: AlertEvidenceProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const [rawOpen, setRawOpen] = useState(false);
  const isOpen = hideToggle ? true : open;

  const {
    transcribed_text,
    detected_words,
    hard_hits,
    soft_hits,
    categories,
    language,
    yamnet_class,
    yamnet_score,
    emotion,
    rms,
    energy_variance,
    zero_crossing_rate,
    peak_to_average,
    waveform_snapshot,
    severity,
    confidence,
    duration,
  } = alert;

  const hasHardHits = !!hard_hits && hard_hits.length > 0;
  const hasSoftHits = !!soft_hits && soft_hits.length > 0;
  const hasWords = hasHardHits || hasSoftHits || (!!detected_words && detected_words.length > 0);
  const hasCategories = !!categories && categories.length > 0;
  const hasAcoustic =
    !!emotion || !!yamnet_class || rms != null || zero_crossing_rate != null || energy_variance != null;
  const hasWaveform = !!waveform_snapshot && waveform_snapshot.length > 0;
  const hasRaw = peak_to_average != null || zero_crossing_rate != null || hasWaveform;
  const hasAny = !!transcribed_text || hasWords || hasAcoustic || hasCategories || hasWaveform;

  const langLabel = languageLabel(language);

  return (
    <div>
      {!hideToggle && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 transition-colors"
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isOpen ? "Hide Evidence" : "View Evidence"}
        </button>
      )}

      {isOpen && (
        <div className="mt-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] space-y-5">
          {!hasAny ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No evidence data available
            </p>
          ) : (
            <>
              {/* ── Detection Summary ── */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Detection Summary
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${
                    severity === "high"
                      ? "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400"
                      : severity === "medium"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400"
                  }`}>
                    <ShieldAlert className="w-3 h-3" />
                    {severity}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400">
                    <BarChart2 className="w-3 h-3" />
                    {Math.round(confidence * 100)}% confidence
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-500/10 text-gray-600 border-gray-300/40 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                    <Clock className="w-3 h-3" />
                    {duration.toFixed(1)}s
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400">
                    {langLabel}
                  </span>
                </div>
              </section>

              {/* ── What Was Said ── */}
              {(transcribed_text || hasWords) && (
                <section className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    What Was Said
                  </h4>

                  {transcribed_text && (
                    <div className="relative flex gap-2 p-3 pl-4 rounded-xl rounded-bl-sm bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15">
                      <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-200 italic leading-relaxed">
                        &ldquo;{transcribed_text}&rdquo;
                      </p>
                    </div>
                  )}

                  {hasWords && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">Detected words</span>
                      <div className="flex flex-wrap gap-1.5">
                        {/* hard_hits — red pills */}
                        {(hasHardHits ? hard_hits! : []).map((word, i) => (
                          <span
                            key={`hard-${word}-${i}`}
                            className="px-2.5 py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-600 border-red-500/25 dark:bg-red-500/15 dark:text-red-400"
                          >
                            {word}
                          </span>
                        ))}
                        {/* soft_hits — orange pills */}
                        {(hasSoftHits ? soft_hits! : []).map((word, i) => (
                          <span
                            key={`soft-${word}-${i}`}
                            className="px-2.5 py-1 text-xs font-medium rounded-full border bg-orange-500/10 text-orange-600 border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-400"
                          >
                            {word}
                          </span>
                        ))}
                        {/* fallback: detected_words if no hard/soft hits */}
                        {!hasHardHits && !hasSoftHits && (detected_words ?? []).map((word, i) => (
                          <span
                            key={`dw-${word}-${i}`}
                            className="px-2.5 py-1 text-xs font-medium rounded-full border bg-gray-500/10 text-gray-600 border-gray-300/40 dark:text-gray-300 dark:border-white/10"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ── Type of Bullying ── */}
              {hasCategories && (
                <section className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Type of Bullying
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {categories!.map((cat) => (
                      <span
                        key={cat}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${categoryBadgeColor(cat)}`}
                      >
                        {categoryLabel(cat)}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Acoustic Evidence ── */}
              {hasAcoustic && (
                <section className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Audio Analysis
                  </h4>

                  <div className="flex flex-wrap items-center gap-2">
                    {emotion && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${emotionBadgeColor(emotion)}`}
                      >
                        {emotion}
                      </span>
                    )}
                    {yamnet_class && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium">
                        <Waves className="w-3 h-3" />
                        {yamnet_class}
                        {yamnet_score != null && (
                          <span className="font-mono opacity-70">({yamnet_score.toFixed(2)})</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {rms != null && (
                      <MetricBar
                        label="Volume (RMS)"
                        value={(rms / 3000) * 100}
                        display={Math.round(rms).toString()}
                        barClass="bg-gradient-to-r from-indigo-500 to-purple-500"
                        icon={Volume2}
                      />
                    )}
                    {zero_crossing_rate != null && (
                      <MetricBar
                        label="Voice tension"
                        value={(zero_crossing_rate / 0.3) * 100}
                        display={zero_crossing_rate.toFixed(3)}
                        barClass="bg-gradient-to-r from-purple-500 to-cyan-500"
                        icon={Activity}
                      />
                    )}
                    {energy_variance != null && (
                      <MetricBar
                        label="Energy variance"
                        value={(energy_variance / 15000) * 100}
                        display={Math.round(energy_variance).toString()}
                        barClass="bg-gradient-to-r from-cyan-500 to-indigo-500"
                        icon={Activity}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* ── Raw Data (collapsible) ── */}
              {hasRaw && (
                <section>
                  <button
                    onClick={() => setRawOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {rawOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Raw Data
                  </button>
                  {rawOpen && (
                    <div className="mt-2 space-y-2">
                      {peak_to_average != null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 dark:text-gray-500">Peak-to-average ratio</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300">{peak_to_average.toFixed(4)}</span>
                        </div>
                      )}
                      {zero_crossing_rate != null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 dark:text-gray-500">Zero crossing rate</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300">{zero_crossing_rate.toFixed(4)}</span>
                        </div>
                      )}
                      {hasWaveform && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Waveform snapshot</p>
                          <WaveformDisplay snapshot={waveform_snapshot!} emotion={emotion} />
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          <p className="pt-3 border-t border-gray-100 dark:border-white/10 text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
            {PRIVACY_NOTE}
          </p>
        </div>
      )}
    </div>
  );
}
