"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Save, Bell, MapPin, Sliders } from "lucide-react";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

export default function SettingsPage() {
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [durationThreshold, setDurationThreshold]     = useState(3);
  const [notifications, setNotifications]             = useState(true);
  const [location, setLocation]                       = useState("Grade 6 Classroom");

  const handleSave = () => {
    toast.success("Settings saved successfully", {
      style: {
        background: "#1a1a2e",
        color: "#86efac",
        border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: "12px",
      },
    });
  };

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

      <div className="space-y-4">
        {/* Confidence Threshold */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className={CARD}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Confidence Threshold
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Minimum AI confidence to trigger an alert
              </p>
            </div>
            <span className="text-xl font-black text-indigo-500 dark:text-indigo-400 tabular-nums">
              {confidenceThreshold}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-600">0%</span>
            <span className="text-xs text-gray-400 dark:text-gray-600">100%</span>
          </div>
        </motion.div>

        {/* Duration Threshold */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          className={CARD}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-violet-500/10 shrink-0">
              <Sliders className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Duration Threshold
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Minimum sound duration to trigger an alert
              </p>
            </div>
            <span className="text-xl font-black text-violet-500 dark:text-violet-400 tabular-nums">
              {durationThreshold.toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={durationThreshold}
            onChange={(e) => setDurationThreshold(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-600">1s</span>
            <span className="text-xs text-gray-400 dark:text-gray-600">10s</span>
          </div>
        </motion.div>

        {/* Notifications toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.4 }}
          className={CARD}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 shrink-0">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Alert Notifications
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Show toast notifications for new detections
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={notifications}
              onClick={() => setNotifications((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                notifications ? "bg-indigo-500" : "bg-gray-200 dark:bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className={CARD}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Location Name</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Name of the monitored classroom
              </p>
            </div>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            placeholder="e.g. Grade 6 Classroom"
          />
        </motion.div>

        {/* Save button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </motion.button>
      </div>
    </motion.div>
  );
}
