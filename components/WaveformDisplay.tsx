"use client";

interface WaveformDisplayProps {
  snapshot: number[];
  emotion?: string;
}

// Bar color keyed by emotion (acoustic-signature palette).
// angry/aggressive → red, distressed → yellow, upset → orange,
// neutral/silent → green, unknown/missing → gray.
function waveformColor(emotion?: string): string {
  switch ((emotion ?? "").toLowerCase()) {
    case "angry":
    case "aggressive":
      return "#ef4444";
    case "distressed":
      return "#f59e0b";
    case "upset":
      return "#f97316";
    case "neutral":
    case "silent":
      return "#10b981";
    default:
      return "#6b7280";
  }
}

const BARS = 40;
const SLOT = 10; // viewBox units per bar slot
const BAR_W = 6; // bar width within slot
const VIEW_H = 60;
const SCALE = 3000; // value that maps to full height

// Resample an arbitrary-length snapshot down/up to exactly BARS values.
function toBars(snapshot: number[]): number[] {
  if (!snapshot || snapshot.length === 0) return new Array(BARS).fill(0);
  if (snapshot.length === BARS) return snapshot;
  return Array.from({ length: BARS }, (_, i) => {
    const idx = Math.floor((i / BARS) * snapshot.length);
    return snapshot[idx] ?? 0;
  });
}

export default function WaveformDisplay({ snapshot, emotion }: WaveformDisplayProps) {
  const bars = toBars(snapshot);
  const color = waveformColor(emotion);
  const viewW = BARS * SLOT;

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-xl p-3 backdrop-blur-xl">
      <svg
        width="100%"
        height={VIEW_H}
        viewBox={`0 0 ${viewW} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Acoustic waveform signature"
      >
        {bars.map((value, i) => {
          const h = Math.max(2, Math.min(VIEW_H, (value / SCALE) * VIEW_H));
          const x = i * SLOT + (SLOT - BAR_W) / 2;
          const y = VIEW_H - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={BAR_W}
              height={h}
              rx={2}
              fill={color}
              opacity={0.85}
            />
          );
        })}
      </svg>
      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center tracking-wide">
        Acoustic signature · No audio stored
      </p>
    </div>
  );
}
