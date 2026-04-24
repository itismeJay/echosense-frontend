"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Save, Bell, MapPin, Sliders, WifiOff, Loader2 } from "lucide-react";
import type { Settings } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/api";

const DEFAULT_SETTINGS: Settings = {
  confidence_threshold: 75,
  duration_threshold: 3,
  notifications: true,
  location: "Grade 6 Classroom",
};

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

export default function SettingsPage() {
  const [settings, setSettings]               = useState<Settings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((data) => { if (!cancelled) { setSettings(data); setBackendAvailable(true); } })
      .catch(() => { if (!cancelled) setBackendAvailable(false); })
      .finally(() => { if (!cancelled) setLoadingSettings(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setBackendAvailable(true);
      toast.success("Settings saved", {
        style: { background: "#1a1a2e", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px" },
      });
    } catch {
      setBackendAvailable(false);
      toast.error("Failed to save — backend unavailable", {
        style: { background: "#1a1a2e", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px" },
      });
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-2xl"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Configure the EchoSense detection system parameters
        </p>
      </div>

      {loadingSettings ? (
        <div className="space-y-4 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {!backendAvailable && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Using defaults — backend unavailable. Changes won&apos;t persist until the backend is reachable.</span>
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4 }} className={CARD}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
                <Sliders className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Confidence Threshold</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Minimum AI confidence to trigger an alert</p>
              </div>
              <span className="text-xl font-black text-indigo-500 dark:text-indigo-400 tabular-nums">{settings.confidence_threshold}%</span>
            </div>
            <input type="range" min={0} max={100} value={settings.confidence_threshold}
              onChange={(e) => update("confidence_threshold", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer" />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-600">0%</span>
              <span className="text-xs text-gray-400 dark:text-gray-600">100%</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }} className={CARD}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-violet-500/10 shrink-0">
                <Sliders className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Duration Threshold</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Minimum sound duration to trigger an alert</p>
              </div>
              <span className="text-xl font-black text-violet-500 dark:text-violet-400 tabular-nums">{settings.duration_threshold.toFixed(1)}s</span>
            </div>
            <input type="range" min={1} max={10} step={0.5} value={settings.duration_threshold}
              onChange={(e) => update("duration_threshold", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer" />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-600">1s</span>
              <span className="text-xs text-gray-400 dark:text-gray-600">10s</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }} className={CARD}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 shrink-0">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Alert Notifications</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Show toast notifications for new detections</p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={settings.notifications}
                onClick={() => update("notifications", !settings.notifications)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${settings.notifications ? "bg-indigo-500" : "bg-gray-200 dark:bg-white/10"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${settings.notifications ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.4 }} className={CARD}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Location Name</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Name of the monitored classroom</p>
              </div>
            </div>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => update("location", e.target.value)}
              className="w-full px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="e.g. Grade 6 Classroom"
            />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
