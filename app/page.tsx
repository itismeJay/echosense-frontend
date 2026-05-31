"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu, Mic2, Radio, Bell, ShieldAlert,
  ChevronRight, ArrowRight,
  Activity, AlertTriangle, AlertCircle, Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ThemeToggle from "@/components/ThemeToggle";
import { capitalize } from "@/lib/format";
import { useCurrentUser } from "@/lib/auth";
import { getLogsStats } from "@/lib/api";
import type { LogsStats } from "@/lib/types";

// ── Static data ───────────────────────────────────────────────────

interface FeatureCard {
  icon: LucideIcon;
  color: string;
  accent: string;
  hardware: string;
  label: string;
  description: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: Cpu,
    color: "text-indigo-400",
    accent: "bg-indigo-500/10",
    hardware: "Raspberry Pi 5",
    label: "Edge AI Processing",
    description: "Runs YAMNet inference on-device — no cloud dependency, sub-second latency.",
  },
  {
    icon: Mic2,
    color: "text-purple-400",
    accent: "bg-purple-500/10",
    hardware: "EMEET USB Mic",
    label: "360° Audio Monitoring",
    description: "Omnidirectional capture ensures no aggression event escapes detection.",
  },
  {
    icon: Radio,
    color: "text-cyan-400",
    accent: "bg-cyan-500/10",
    hardware: "YAMNet AI Model",
    label: "Aggression Detection",
    description: "521-class audio classifier fine-tuned to identify verbal aggression patterns.",
  },
];

interface Step {
  num: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    icon: Mic2,
    title: "Capture",
    body: "The EMEET mic captures continuous classroom audio at high fidelity.",
  },
  {
    num: "02",
    icon: Cpu,
    title: "Classify",
    body: "YAMNet processes each audio frame locally on the Raspberry Pi 5.",
  },
  {
    num: "03",
    icon: ShieldAlert,
    title: "Detect",
    body: "Aggression events are flagged when confidence exceeds the threshold.",
  },
  {
    num: "04",
    icon: Bell,
    title: "Alert",
    body: "A real-time alert is pushed to the dashboard within milliseconds.",
  },
];

interface StatTile {
  key: "total_alerts" | "high_severity" | "medium_severity" | "low_severity";
  label: string;
  icon: LucideIcon;
  numColor: string;
  iconBg: string;
  borderColor: string;
}

const STAT_TILES: StatTile[] = [
  {
    key: "total_alerts",
    label: "Total Alerts",
    icon: Activity,
    numColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 text-indigo-400",
    borderColor: "border-t-indigo-500",
  },
  {
    key: "high_severity",
    label: "High Severity",
    icon: ShieldAlert,
    numColor: "text-red-400",
    iconBg: "bg-red-500/10 text-red-400",
    borderColor: "border-t-red-500",
  },
  {
    key: "medium_severity",
    label: "Medium",
    icon: AlertTriangle,
    numColor: "text-amber-400",
    iconBg: "bg-amber-500/10 text-amber-400",
    borderColor: "border-t-amber-500",
  },
  {
    key: "low_severity",
    label: "Low Severity",
    icon: AlertCircle,
    numColor: "text-green-400",
    iconBg: "bg-green-500/10 text-green-400",
    borderColor: "border-t-green-500",
  },
];

const TEAM = ["Khirt Abapo", "Dharel Khin Melegrito", "RB Jay Salamanes"];

// ── Framer Motion variants ────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Component ─────────────────────────────────────────────────────

export default function LandingPage() {
  const currentUser = useCurrentUser();

  const [stats, setStats] = useState<LogsStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getLogsStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  // useCurrentUser() starts null on server/first render, resolves from cookie after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const ctaHref = !mounted ? null : currentUser ? "/dashboard" : "/login";

  // Most common emotion across all incidents (from evidence aggregates)
  const topEmotion = (() => {
    const b = stats?.emotion_breakdown;
    if (!b) return null;
    let best: string | null = null;
    let max = 0;
    for (const [emotion, count] of Object.entries(b)) {
      if (typeof count === "number" && count > max) {
        max = count;
        best = emotion;
      }
    }
    return best;
  })();

  return (
    <div className="relative overflow-x-hidden">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient mesh gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
          style={{ animation: "float 10s ease-in-out infinite", animationDelay: "2s" }}
        />
        <div
          className="absolute top-3/4 left-3/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl"
          style={{ animation: "float 12s ease-in-out infinite", animationDelay: "4s" }}
        />
      </div>

      {/* Background audio wave decoration */}
      <div className="fixed inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <div className="w-full max-w-5xl">
          <AudioVisualizer variant="hero" intensity="idle" />
        </div>
      </div>

      <main className="relative z-10 flex flex-col items-center">

        {/* ── Section 1: Hero ──────────────────────────────────── */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center text-center px-4 pt-20 pb-24">
          <div className="max-w-3xl mx-auto flex flex-col items-center">

            {/* Logo with pulse */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8 p-4 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(99,102,241,0.15)]"
              >
                <Radio className="w-12 h-12 text-indigo-400" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-6xl sm:text-8xl font-black tracking-tighter mb-3 bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
            >
              EchoSense
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-2 font-light"
            >
              Real-Time Acoustic Aggression Detection
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-sm text-gray-400 dark:text-gray-600 mb-10"
            >
              IoT Edge-AI System · Powered by Raspberry Pi 5 + YAMNet
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {ctaHref ? (
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:scale-105 active:scale-100 transition-all duration-200"
                >
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <div className="h-[52px] w-44 rounded-2xl bg-white/20 dark:bg-white/5 animate-pulse" />
              )}
            </motion.div>

            {/* School */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="mt-8 text-xs text-gray-400 dark:text-gray-600"
            >
              Davao del Norte State College · Capstone 2026
            </motion.p>
          </div>
        </section>

        {/* ── Section 2: Feature Cards ─────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p
              variants={fadeUp}
              className="text-center text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-10 font-semibold"
            >
              Powered By
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, color, accent, hardware, label, description }) => (
                <motion.div
                  key={label}
                  variants={cardVariant}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none"
                >
                  <div className={`p-2.5 rounded-xl w-fit ${accent}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                      {hardware}
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Section 3: How It Works ──────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p
              variants={fadeUp}
              className="text-center text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-12 font-semibold"
            >
              How It Works
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-6 sm:gap-0">
              {STEPS.map((step, i) => (
                <div key={step.num} className="flex sm:flex-row items-center sm:items-start">
                  <motion.div
                    variants={cardVariant}
                    className="flex flex-col items-center text-center sm:w-44 gap-3 px-4"
                  >
                    <span className="text-[10px] font-black text-indigo-400 tabular-nums">
                      {step.num}
                    </span>
                    <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none">
                      <step.icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{step.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{step.body}</p>
                  </motion.div>

                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:flex items-center self-center mt-6 text-gray-300 dark:text-gray-700 shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Section 4: Live Stats ────────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p
              variants={fadeUp}
              className="text-center text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8 font-semibold"
            >
              Live System Stats
            </motion.p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STAT_TILES.map(({ key, label, icon: Icon, numColor, iconBg, borderColor }) => (
                <motion.div
                  key={key}
                  variants={cardVariant}
                  className={`bg-white/60 dark:bg-white/5 backdrop-blur-xl border-t-2 border border-white/80 dark:border-white/10 ${borderColor} rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                      {label}
                    </p>
                    <div className={`p-2 rounded-xl ${iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  {statsLoading ? (
                    <div className="h-8 w-14 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
                  ) : (
                    <p className={`text-3xl font-black tabular-nums ${numColor}`}>
                      {stats ? stats[key] : "—"}
                    </p>
                  )}
                </motion.div>
              ))}

              {topEmotion && (
                <motion.div
                  variants={cardVariant}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-t-2 border border-white/80 dark:border-white/10 border-t-purple-500 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                      Most common emotion
                    </p>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-purple-400">
                    {capitalize(topEmotion)}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ── Section 5: Footer ────────────────────────────────── */}
        <footer className="w-full border-t border-white/40 dark:border-white/5 mt-4 py-10 px-4">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Davao del Norte State College · Capstone 2026
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TEAM.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1 text-xs bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-full text-gray-500 dark:text-gray-400"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
