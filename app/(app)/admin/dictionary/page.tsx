"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BookOpen,
  Globe2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import {
  addDictionaryEntry,
  deleteDictionaryEntry,
  getDictionary,
} from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import type { DictionaryEntry } from "@/lib/types";

const INPUT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export default function DictionaryPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [term, setTerm] = useState("");
  const [language, setLanguage] = useState("Filipino");
  const [alertWeight, setAlertWeight] = useState(0.7);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<DictionaryEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setEntries(await getDictionary());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadEntries]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await addDictionaryEntry({
        slur_text: term,
        language,
        severity_weight: alertWeight,
      });
      setEntries((current) => [created, ...current]);
      setTerm("");
      setLanguage("Filipino");
      setAlertWeight(0.7);
      toast.success("Monitored term saved.");
    } catch {
      toast.error("We couldn’t save the monitored term.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDictionaryEntry(deleteTarget.term_id);
      setEntries((current) =>
        current.filter((entry) => entry.term_id !== deleteTarget.term_id)
      );
      setDeleteTarget(null);
      toast.success("Monitored term deleted.");
    } catch {
      toast.error("We couldn’t delete the monitored term.");
    } finally {
      setDeleting(false);
    }
  };

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Administrator
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
          Monitored Terms
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Manage terms and alert weights used by the current monitoring system.
          These terms support detection and do not confirm an incident.
        </p>
      </header>

      <section
        aria-labelledby="add-term-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex gap-3">
          <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="add-term-title"
              className="font-bold text-slate-950 dark:text-white"
            >
              Add Monitored Term
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              The value is saved to the monitored-terms list.
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => void handleSave(event)}
          className="mt-5 grid gap-4 md:grid-cols-3"
        >
          <div>
            <label
              htmlFor="monitored-term"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Term
            </label>
            <input
              id="monitored-term"
              type="text"
              required
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="term-language"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Language
            </label>
            <select
              id="term-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={INPUT}
            >
              <option value="Filipino">Filipino</option>
              <option value="Bisaya">Bisaya</option>
              <option value="English">English</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="term-alert-weight"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Alert Weight
              </label>
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {alertWeight.toFixed(1)}
              </span>
            </div>
            <input
              id="term-alert-weight"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={alertWeight}
              onChange={(event) =>
                setAlertWeight(Number(event.target.value))
              }
              className="mt-1 h-11 w-full cursor-pointer accent-indigo-700"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting ? "Saving…" : "Save Term"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8" aria-labelledby="saved-terms-title">
        <div className="mb-4">
          <h2
            id="saved-terms-title"
            className="text-xl font-bold text-slate-950 dark:text-white"
          >
            Saved Terms
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {loading
              ? "Loading terms…"
              : `${entries.length} term${entries.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <div role="status" className="grid gap-4 sm:grid-cols-2">
            <span className="sr-only">Loading monitored terms</span>
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
          >
            <h3 className="font-bold text-red-950 dark:text-red-100">
              We couldn&apos;t load monitored terms.
            </h3>
            <button
              type="button"
              onClick={() => void loadEntries()}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <BookOpen className="mx-auto h-7 w-7 text-slate-500" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-slate-950 dark:text-white">
              No monitored terms are available.
            </h3>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <article
                key={entry.term_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-slate-950 dark:text-white">
                      {entry.slur_text}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Globe2 className="h-4 w-4" aria-hidden="true" />
                      {entry.language}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(entry)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    aria-label={`Delete ${entry.slur_text}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Alert Weight
                  </span>
                  <span className="ml-auto font-bold text-slate-950 dark:text-white">
                    {entry.severity_weight.toFixed(1)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {deleteTarget && (
        <AccessibleDialog
          title="Delete Monitored Term"
          description={`Delete “${deleteTarget.slur_text}” from the monitored-terms list?`}
          onClose={() => setDeleteTarget(null)}
          closeDisabled={deleting}
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              aria-busy={deleting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700 disabled:opacity-60"
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {deleting ? "Deleting…" : "Delete Term"}
            </button>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
}
