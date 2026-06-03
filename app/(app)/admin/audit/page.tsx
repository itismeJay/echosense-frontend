"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ClipboardList, LockKeyhole, WifiOff } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { getAuditLogs } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import { formatTimestamp } from "@/lib/format";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

export default function AuditPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [fetching, setFetching]   = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const fetchLogs = useCallback(async () => {
    setFetching(true);
    setFetchError(false);
    try {
      setLogs(await getAuditLogs());
    } catch {
      setFetchError(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {fetching ? "Loading..." : `${logs.length} event${logs.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <LockKeyhole className="w-4 h-4" />
            Read only
          </div>
        </div>

        {fetching ? (
          <div className="animate-pulse p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-50 dark:border-white/5">
                <div className="h-3 w-32 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-28 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-36 bg-gray-100 dark:bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="p-3 rounded-2xl bg-gray-500/10 border border-gray-500/20">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Failed to load audit logs</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check your connection and try again</p>
            </div>
            <button
              onClick={() => void fetchLogs()}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
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
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No audit events recorded yet
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{log.actor}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{log.action}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{log.target}</td>
                      <td className="py-3 px-4 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
