"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, BellRing, CheckCircle2, Clock3, ShieldAlert, UserRoundCheck } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import StatCard from "@/components/StatCard";
import SeverityBadge from "@/components/SeverityBadge";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

const incidents = [
  { id: "ALT-1048", severity: "high" as const, location: "Grade 6 Classroom", keyword: "gago", time: "4 mins ago" },
  { id: "ALT-1047", severity: "medium" as const, location: "Grade 5 Classroom", keyword: "stupid", time: "18 mins ago" },
  { id: "ALT-1046", severity: "low" as const, location: "Library Corner", keyword: "bobo", time: "42 mins ago" },
  { id: "ALT-1045", severity: "high" as const, location: "Grade 6 Classroom", keyword: "putangina", time: "1 hour ago" },
  { id: "ALT-1044", severity: "medium" as const, location: "Hallway B", keyword: "gago", time: "2 hours ago" },
];

export default function CounselorPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "counselor") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  if (currentUser && currentUser.role !== "admin" && currentUser.role !== "counselor") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-xl space-y-5"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
            <UserRoundCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Counselor Overview</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
              Active intervention snapshot and recent incidents
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Today's Active Alerts", value: 3, icon: BellRing, accent: "indigo" as const },
          { label: "Resolved Today", value: 7, icon: CheckCircle2, accent: "emerald" as const },
          { label: "Total This Week", value: 24, icon: Clock3, accent: "amber" as const },
          { label: "High Severity", value: 2, icon: ShieldAlert, accent: "red" as const },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
          >
            <StatCard {...item} />
          </motion.div>
        ))}
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            Recent Incidents
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">Last 5 alerts</span>
        </div>

        <div className="space-y-2">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-white/5 p-4 transition-colors hover:bg-indigo-50/50 dark:hover:bg-white/8 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <SeverityBadge severity={incident.severity} dot />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {incident.location}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {incident.id} · Keyword: {incident.keyword}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 sm:text-right">
                {incident.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
