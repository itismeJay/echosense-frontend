"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Grid3X3, MapPinned } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

const zones = [
  { name: "Front-Left", level: "HIGH", className: "bg-red-500/75 border-red-400/50 text-white" },
  { name: "Front-Center", level: "MEDIUM", className: "bg-amber-400/70 border-amber-300/50 text-gray-950" },
  { name: "Front-Right", level: "LOW", className: "bg-emerald-400/70 border-emerald-300/50 text-gray-950" },
  { name: "Middle-Left", level: "MEDIUM", className: "bg-amber-400/70 border-amber-300/50 text-gray-950" },
  { name: "Middle-Center", level: "LOW", className: "bg-emerald-400/70 border-emerald-300/50 text-gray-950" },
  { name: "Middle-Right", level: "MEDIUM", className: "bg-amber-400/70 border-amber-300/50 text-gray-950" },
  { name: "Back-Left", level: "LOW", className: "bg-emerald-400/70 border-emerald-300/50 text-gray-950" },
  { name: "Back-Center", level: "LOW", className: "bg-emerald-400/70 border-emerald-300/50 text-gray-950" },
  { name: "Back-Right", level: "MEDIUM", className: "bg-amber-400/70 border-amber-300/50 text-gray-950" },
];

const legend = [
  { label: "High", className: "bg-red-500" },
  { label: "Medium", className: "bg-amber-400" },
  { label: "Low", className: "bg-emerald-400" },
];

export default function HeatmapPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-lg space-y-5"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Classroom Heatmap</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Static zone intensity map for recent acoustic incidents
        </p>
      </div>

      <div className={CARD}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
              <MapPinned className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Grade 6 Classroom</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Front of room at top</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className={`w-3 h-3 rounded-full ${item.className}`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4">
          <div className="grid grid-cols-3 gap-3 aspect-square max-w-2xl mx-auto">
            {zones.map((zone) => (
              <div
                key={zone.name}
                className={`rounded-xl border flex flex-col items-center justify-center text-center p-3 shadow-sm ${zone.className}`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">{zone.name}</span>
                <span className="mt-1 text-[11px] font-black">{zone.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Grid3X3 className="w-4 h-4" />
        <span>Zones use static mock intensity data</span>
      </div>
    </motion.div>
  );
}
