"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Clock3, Cpu, Gauge, Server, Thermometer, TimerReset } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

const metrics = [
  { label: "CPU", value: "34%", icon: Cpu, color: "text-indigo-400 bg-indigo-500/10" },
  { label: "Temp", value: "52°C", icon: Thermometer, color: "text-amber-400 bg-amber-500/10" },
  { label: "Uptime", value: "4h 23m", icon: TimerReset, color: "text-emerald-400 bg-emerald-500/10" },
];

export default function HeartbeatPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const online = true;

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pi Heartbeat</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Raspberry Pi health and connection status
        </p>
      </div>

      <div className={CARD}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 shrink-0">
              <Server className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold">
                Raspberry Pi 5
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-lg font-black tracking-wide ${
                    online
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                  />
                  {online ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-64">
            <div className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3">
              <Clock3 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Last heartbeat</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3">
              <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Auto-refresh</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Polls every 60s</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className={CARD}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                  {value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                style={{ width: label === "CPU" ? "34%" : label === "Temp" ? "52%" : "76%" }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Gauge className="w-4 h-4" />
        <span>Static UI preview for defense monitoring</span>
      </div>
    </motion.div>
  );
}
