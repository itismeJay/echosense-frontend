"use client";

import { formatConfidence } from "@/lib/format";

interface ConfidenceMeterProps {
  value: number; // 0..1
}

const RADIUS = 46;
const CX = 60;
const CY = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ConfidenceMeter({ value }: ConfidenceMeterProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] flex flex-col items-center justify-center">
      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
        Confidence Level
      </p>
      <svg
        width={120}
        height={120}
        viewBox="0 0 120 120"
        role="meter"
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Detection confidence"
      >
        <defs>
          <linearGradient id="meterGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="50%"  stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Track ring */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="rgba(99,102,241,0.08)"
          strokeWidth={10}
        />
        {/* Progress arc */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="url(#meterGrad)"
          strokeWidth={10}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{
            transition: "stroke-dashoffset 600ms ease-out",
          }}
        />
        {/* Center value */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-900 dark:fill-white"
          style={{ fontSize: 22, fontWeight: 800 }}
        >
          {formatConfidence(clamped)}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          style={{ fontSize: 9, letterSpacing: 1 }}
        >
          CONFIDENCE
        </text>
      </svg>
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Last detection score</p>
    </div>
  );
}
