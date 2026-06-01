"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu, Mic2, Radio, Bell, ShieldAlert,
  ChevronRight, ArrowRight, Zap, Eye, Lock,
} from "lucide-react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ThemeToggle from "@/components/ThemeToggle";
import { useCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: Zap,
    color: "text-indigo-400",
    accent: "bg-indigo-500/10",
    label: "Sub-second Detection",
    description:
      "YAMNet AI processes audio frames locally on-device — alerts fire in under a second with no cloud round-trip.",
  },
  {
    icon: Eye,
    color: "text-purple-400",
    accent: "bg-purple-500/10",
    label: "360° Audio Coverage",
    description:
      "Omnidirectional microphone capture ensures no aggression event goes undetected, anywhere in the room.",
  },
  {
    icon: Lock,
    color: "text-cyan-400",
    accent: "bg-cyan-500/10",
    label: "Private by Design",
    description:
      "All inference runs on a local Raspberry Pi 5. No audio is ever sent to the cloud — student privacy is protected.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Mic2,
    title: "Capture",
    body: "The EMEET mic continuously captures classroom audio at high fidelity.",
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
    body: "Aggression events are flagged the moment confidence exceeds the threshold.",
  },
  {
    num: "04",
    icon: Bell,
    title: "Alert",
    body: "A real-time alert is pushed to the dashboard within milliseconds.",
  },
];

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

export default function LandingPage() {
  const currentUser = useCurrentUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const ctaHref = !mounted ? null : currentUser ? "/dashboard" : "/login";

  return (
    <div className="relative overflow-x-hidden">

      {/* Sticky navbar */}
      <header className="fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-6 bg-white/70 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/40 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10">
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-black text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            EchoSense
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {ctaHref && (
            <Link
              href={ctaHref}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {currentUser ? "Dashboard" : "Sign in"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Ambient blobs */}
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

      {/* Background wave */}
      <div className="fixed inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <div className="w-full max-w-5xl">
          <AudioVisualizer variant="hero" intensity="idle" />
        </div>
      </div>

      <main className="relative z-10 flex flex-col items-center">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center text-center px-4 pt-14 pb-24">
          <div className="max-w-3xl mx-auto flex flex-col items-center">

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Edge AI · Raspberry Pi 5 · YAMNet
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl sm:text-7xl font-black tracking-tighter mb-5 bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-[1.1]"
            >
              Hear what others miss.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-10 font-light max-w-xl leading-relaxed"
            >
              EchoSense detects verbal aggression in real time — keeping classrooms safer with on-device AI that never sleeps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center gap-3 flex-wrap justify-center"
            >
              {ctaHref ? (
                <>
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:scale-105 active:scale-100 transition-all duration-200"
                  >
                    {currentUser ? "Go to Dashboard" : "Get started"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-2xl border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Learn more
                  </a>
                </>
              ) : (
                <div className="h-[52px] w-44 rounded-2xl bg-white/20 dark:bg-white/5 animate-pulse" />
              )}
            </motion.div>

          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="features" className="w-full max-w-5xl mx-auto px-4 py-24">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">
                Features
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Built for real environments
              </h2>
              <p className="text-gray-400 dark:text-gray-500 mt-3 text-sm max-w-md mx-auto leading-relaxed">
                From audio capture to alert delivery, every step of the pipeline runs on-device with no external dependencies.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, color, accent, label, description }) => (
                <motion.div
                  key={label}
                  variants={cardVariant}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none"
                >
                  <div className={`p-2.5 rounded-xl w-fit ${accent}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── How It Works ──────────────────────────────────────── */}
        <section id="how-it-works" className="w-full max-w-5xl mx-auto px-4 py-24">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                From sound to alert in milliseconds
              </h2>
            </motion.div>

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

        {/* ── Bottom CTA ────────────────────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 py-24">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-white/80 dark:border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
              Ready to see it in action?
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Sign in to access the live dashboard — real-time alerts, analytics, and incident logs, all in one place.
            </p>
            {ctaHref && (
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2.5 px-8 py-4 text-sm font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:scale-105 active:scale-100 transition-all duration-200"
              >
                {currentUser ? "Go to Dashboard" : "Sign in to EchoSense"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        </section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer className="w-full border-t border-white/40 dark:border-white/5 py-10 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-indigo-500/10">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-black text-xs bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                EchoSense
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Davao del Norte State College · Capstone 2026
            </p>
            <nav className="flex gap-5 text-xs text-gray-400 dark:text-gray-500">
              <a href="#features" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                How it works
              </a>
            </nav>
          </div>
        </footer>

      </main>
    </div>
  );
}
