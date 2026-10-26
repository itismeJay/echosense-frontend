"use client";

interface WaveformDisplayProps {
  snapshot: number[];
  emotion?: string;
}

// One neutral color: the emotion is stated in words beside the evidence, never by color alone.
function waveformColor(emotion?: string): string {
  void emotion;
  return "var(--chart)";
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
    <div className="bg-bg border border-white/60 rounded-control p-3">
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
      <p className="mt-2 text-[10px] text-muted text-center">
        Acoustic signature · No audio stored
      </p>
    </div>
  );
}
