"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, animate, useTransform, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value?: number;
  icon: LucideIcon;
  accent?: "indigo" | "red" | "amber" | "emerald";
}

const accentColors: Record<string, { icon: string; border: string }> = {
  indigo:  { icon: "text-indigo-400 bg-indigo-500/10",  border: "border-t-indigo-500"  },
  red:     { icon: "text-red-400 bg-red-500/10",        border: "border-t-red-500"     },
  amber:   { icon: "text-amber-400 bg-amber-500/10",    border: "border-t-amber-500"   },
  emerald: { icon: "text-emerald-400 bg-emerald-500/10", border: "border-t-emerald-500" },
};

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const prevRef = useRef(value);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
    prevRef.current = value;
    return controls.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "indigo",
}: StatCardProps) {
  const { icon: iconColors, border: borderColor } = accentColors[accent];

  return (
    <div
      className={`bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-t-2 border-white/80 dark:border-white/10 ${borderColor} rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 truncate">
            {label}
          </p>
          {value === undefined ? (
            <div className="h-8 w-16 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
              <AnimatedNumber value={value} />
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconColors}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
