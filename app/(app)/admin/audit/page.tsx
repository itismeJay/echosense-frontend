"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ClipboardList, LockKeyhole } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

const rows = [
  {
    actor: "admin@echosense.local",
    action: "Updated AI Settings",
    target: "confidence_threshold",
    timestamp: "2 mins ago",
  },
  {
    actor: "admin@echosense.local",
    action: "Created User",
    target: "staff@echosense.local",
    timestamp: "1 hour ago",
  },
  {
    actor: "admin@echosense.local",
    action: "Deleted User",
    target: "olduser@test.com",
    timestamp: "3 hours ago",
  },
];

export default function AuditPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Audit Log</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Read-only history of administrative actions
        </p>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Administrative Events</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Static read-only sample data</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <LockKeyhole className="w-4 h-4" />
            Read only
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Actor</th>
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Action</th>
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Target</th>
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.action}-${row.timestamp}`}
                  className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{row.actor}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{row.action}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{row.target}</td>
                  <td className="py-3 px-4 text-gray-400 dark:text-gray-500">{row.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
