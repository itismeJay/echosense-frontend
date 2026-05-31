"use client";

import { useState } from "react";
import type { Alert } from "@/lib/types";
import { emotionBadgeColor } from "@/lib/format";
import WaveformDisplay from "./WaveformDisplay";
import { ChevronDown, ChevronUp, Quote, Volume2, Activity, Waves } from "lucide-react";

interface AlertEvidenceProps {
  alert: Alert;
  /** Render the panel already open (used by the logs row-expand). */
  defaultExpanded?: boolean;
  /** Hide the built-in "View Evidence" toggle (parent controls visibility). */
  hideToggle?: boolean;
}

// Aggression keywords that should render as red pills (multi-lingual).
const HIGH_SEVERITY_WORDS = new Set(
  [
    // English
    "kill", "die", "hate", "stupid", "idiot", "fight", "hit", "hurt", "shutup", "shut up",
    // Filipino / Tagalog
    "putang", "putangina", "gago", "tanga", "bobo", "patay", "leche", "tarantado",
    // Bisaya
    "yawa", "buang", "pisti", "atay", "animal", "lagot",
  ].map((w) => w.toLowerCase())
);

const FILIPINO_WORDS = new Set([
  "putang", "putangina", "gago", "tanga", "bobo", "patay", "leche", "tarantado",
  "sigaw", "away", "takot", "tulong", "saklolo",
]);

const BISAYA_WORDS = new Set([
  "yawa", "buang", "pisti", "atay", "animal", "lagot", "kalit", "hilak",
]);

function isHighSeverityWord(word: string): boolean {
  return HIGH_SEVERITY_WORDS.has(word.trim().toLowerCase());
}

function detectLanguages(words: string[]): string[] {
  const langs = new Set<string>();
  let sawNonMatch = false;
  for (const raw of words) {
    const w = raw.trim().toLowerCase();
    if (FILIPINO_WORDS.has(w)) langs.add("Filipino");
    else if (BISAYA_WORDS.has(w)) langs.add("Bisaya");
    else sawNonMatch = true;
  }
  if (sawNonMatch) langs.add("English");
  return Array.from(langs);
}

// Module-level (not defined inside render) to satisfy the no-nested-component lint rule.
function MetricBar({
  label,
  value,
  display,
  barClass,
  icon: Icon,
}: {
  label: string;
  value: number; // 0..100
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
  const [expanded, setExpanded] = useState(defaultExpanded);
  const open = hideToggle ? true : expanded;

  const {
    transcribed_text,
    detected_words,
    yamnet_class,
    emotion,
    rms,
    energy_variance,
    zero_crossing_rate,
    waveform_snapshot,
  } = alert;

  const hasWords = !!detected_words && detected_words.length > 0;
  const hasAcoustic =
    !!emotion ||
    !!yamnet_class ||
    rms != null ||
    zero_crossing_rate != null ||
    energy_variance != null;
  const hasWaveform = !!waveform_snapshot && waveform_snapshot.length > 0;
  const hasAny = !!transcribed_text || hasWords || hasAcoustic || hasWaveform;

  const languages = hasWords ? detectLanguages(detected_words!) : [];

  return (
    <div>
      {!hideToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 transition-colors"
        >
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? "Hide Evidence" : "View Evidence"}
        </button>
      )}

      {open && (
        <div className="mt-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] space-y-5">
          {!hasAny ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No evidence data available
            </p>
          ) : (
            <>
              {/* ── Section 1: What was heard ── */}
              {(transcribed_text || hasWords) && (
                <section className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    What Was Heard
                  </h4>

                  {transcribed_text && (
                    <div className="relative flex gap-2 p-3 pl-4 rounded-xl rounded-bl-sm bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15">
                      <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-200 italic leading-relaxed">
                        “{transcribed_text}”
                      </p>
                    </div>
                  )}

                  {hasWords && (
                    <div className="flex flex-wrap gap-1.5">
                      {detected_words!.map((word, i) => (
                        <span
                          key={`${word}-${i}`}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                            isHighSeverityWord(word)
                              ? "bg-red-500/10 text-red-600 border-red-500/25 dark:text-red-400"
                              : "bg-gray-500/10 text-gray-600 border-gray-300/40 dark:text-gray-300 dark:border-white/10"
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}

                  {languages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">Language:</span>
                      {languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ── Section 2: Acoustic evidence ── */}
              {hasAcoustic && (
                <section className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Acoustic Evidence
                  </h4>

                  <div className="flex flex-wrap items-center gap-2">
                    {emotion && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${emotionBadgeColor(
                          emotion
                        )}`}
                      >
                        {emotion}
                      </span>
                    )}
                    {yamnet_class && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium">
                        <Waves className="w-3 h-3" />
                        {yamnet_class}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {rms != null && (
                      <MetricBar
                        label="Volume"
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

              {/* ── Section 3: Waveform signature ── */}
              {hasWaveform && (
                <section className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Waveform Signature
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Voice intensity pattern</p>
                  <WaveformDisplay snapshot={waveform_snapshot!} emotion={emotion} />
                </section>
              )}
            </>
          )}

          {/* Privacy note — always visible when expanded */}
          <p className="pt-3 border-t border-gray-100 dark:border-white/10 text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
            {PRIVACY_NOTE}
          </p>
        </div>
      )}
    </div>
  );
}
