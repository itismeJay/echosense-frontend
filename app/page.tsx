"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Mic2, Radio, ArrowRight } from "lucide-react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ThemeToggle from "@/components/ThemeToggle";

const TEAM = ["Khirt Abapo", "Dharel Khin Melegrito", "RB Jay Salamanes"];

const HARDWARE = [
  { icon: Cpu,   color: "text-indigo-400",  label: "Raspberry Pi 5",       sub: "Edge AI Processing"   },
  { icon: Mic2,  color: "text-purple-400",  label: "ReSpeaker 2-Mic HAT",  sub: "24/7 Audio Monitoring" },
  { icon: Radio, color: "text-cyan-400",    label: "YAMNet AI Model",       sub: "Aggression Detection" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">
      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient mesh gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <div className="w-full max-w-5xl">
          <AudioVisualizer variant="hero" intensity="idle" />
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 p-4 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(99,102,241,0.15)]"
        >
          <Radio className="w-12 h-12 text-indigo-400" />
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
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:scale-105 active:scale-100 transition-all duration-200"
          >
            Enter Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Hardware cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl"
        >
          {HARDWARE.map(({ icon: Icon, color, label, sub }) => (
            <div
              key={label}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none"
            >
              <Icon className={`w-6 h-6 ${color}`} />
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Project and team */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="mt-8 p-5 bg-white/40 dark:bg-white/[0.03] rounded-2xl border border-white/60 dark:border-white/5 w-full max-w-xl"
        >
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Davao del Norte State College · Capstone 2026
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TEAM.map((name) => (
              <span
                key={name}
                className="px-3 py-1 text-xs bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-full text-gray-600 dark:text-gray-400"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
