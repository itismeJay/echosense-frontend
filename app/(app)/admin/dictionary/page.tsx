"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { BookOpen, Loader2, Plus, Save, Trash2, WifiOff } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { getDictionary, addDictionaryEntry, deleteDictionaryEntry } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/types";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";
const INPUT = "w-full px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors";
const TOAST_SUCCESS = { style: { background: "#1a1a2e", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px" } };
const TOAST_ERROR   = { style: { background: "#1a1a2e", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px" } };

export default function DictionaryPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  const [entries, setEntries]       = useState<DictionaryEntry[]>([]);
  const [fetching, setFetching]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [keyword, setKeyword]               = useState("");
  const [language, setLanguage]             = useState("Filipino");
  const [severityWeight, setSeverityWeight] = useState(0.7);
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const fetchEntries = useCallback(async () => {
    setFetching(true);
    setFetchError(false);
    try {
      setEntries(await getDictionary());
    } catch {
      setFetchError(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  const handleDelete = async (entry: DictionaryEntry) => {
    setDeletingId(entry.id);
    try {
      await deleteDictionaryEntry(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success(`"${entry.keyword}" removed`, TOAST_SUCCESS);
    } catch {
      toast.error("Failed to delete keyword", TOAST_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await addDictionaryEntry({ keyword, language, severity_weight: severityWeight });
      setEntries((prev) => [created, ...prev]);
      toast.success("Keyword saved", TOAST_SUCCESS);
      setKeyword("");
      setLanguage("Filipino");
      setSeverityWeight(0.7);
    } catch {
      toast.error("Failed to save keyword", TOAST_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-lg space-y-5"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Keyword Dictionary</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Manage static severity weights for monitored words
        </p>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-white/10">
          <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Dictionary Entries</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{entries.length} keyword{entries.length !== 1 ? "s" : ""} in dictionary</p>
          </div>
        </div>

        {fetching ? (
          <div className="animate-pulse p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-50 dark:border-white/5">
                <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-20 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="p-3 rounded-2xl bg-gray-500/10 border border-gray-500/20">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Failed to load dictionary</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check your connection and try again</p>
            </div>
            <button
              onClick={() => void fetchEntries()}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Keyword</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Language</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Severity Weight</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No keywords in dictionary yet
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{entry.keyword}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{entry.language}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${entry.severity_weight * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 tabular-nums">{entry.severity_weight.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => void handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Delete ${entry.keyword}`}
                        >
                          {deletingId === entry.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={(e) => void handleSave(e)} className={`${CARD} p-5`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0">
            <Plus className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Add New Keyword</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Saved to the backend blacklist database</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Enter keyword"
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Language
            </label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={INPUT}
            >
              <option value="Bisaya">Bisaya</option>
              <option value="Filipino">Filipino</option>
              <option value="English">English</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Severity Weight
              </label>
              <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 tabular-nums">
                {severityWeight.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={severityWeight}
              onChange={(event) => setSeverityWeight(Number(event.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-600">0.0</span>
              <span className="text-xs text-gray-400 dark:text-gray-600">1.0</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {submitting ? "Saving..." : "Save"}
        </button>
      </form>
    </motion.div>
  );
}
