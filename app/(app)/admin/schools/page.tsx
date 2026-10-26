"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building2,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import { ApiError, createSchool, updateSchool } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { schoolErrorMessage } from "@/lib/schools-contract";
import { useSchools } from "@/lib/useSchools";
import type { School } from "@/lib/types";

const INPUT =
  "min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink       ";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiError ? schoolErrorMessage(error.status, fallback) : fallback;
}

interface SchoolNameDialogProps {
  school: School | null;
  onClose: () => void;
  onSaved: (school: School) => void;
}

function SchoolNameDialog({ school, onClose, onSaved }: SchoolNameDialogProps) {
  const [name, setName] = useState(school?.name ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a school name.");
      return;
    }
    if (school && trimmed === school.name) {
      onClose();
      return;
    }
    setPending(true);
    setError("");
    try {
      onSaved(school ? await updateSchool(school.id, { name: trimmed }) : await createSchool(trimmed));
    } catch (err) {
      setError(errorText(err, "We couldn’t save the school. Please try again."));
    } finally {
      setPending(false);
    }
  };

  return (
    <AccessibleDialog
      title={school ? "Edit school name" : "Add school"}
      description={
        school
          ? "The new name appears everywhere this school is shown."
          : "Create a school, then add its classrooms, devices and users."
      }
      onClose={onClose}
      closeDisabled={pending}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="school-name"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            School name
          </label>
          <input
            id="school-name"
            required
            maxLength={200}
            value={name}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "school-name-error" : undefined}
            onChange={(event) => setName(event.target.value)}
            className={INPUT}
          />
        </div>
        {error && (
          <p
            id="school-name-error"
            role="alert"
            className="flex items-start gap-2 text-sm font-medium text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-control border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {pending ? "Saving…" : school ? "Save name" : "Create school"}
          </button>
        </div>
      </form>
    </AccessibleDialog>
  );
}

export default function SchoolsPage() {
  // The (app) page guard only renders this page for super admins.
  const { schools, setSchools, loading, error, reload } = useSchools(true);
  const [editing, setEditing] = useState<School | "new" | null>(null);
  const [toggling, setToggling] = useState<School | null>(null);
  const [togglePending, setTogglePending] = useState(false);

  const saveSchool = (saved: School) => {
    setSchools((current) =>
      [...current.filter((school) => school.id !== saved.id), saved].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    toast.success(editing === "new" ? "School created." : "School name saved.");
    setEditing(null);
  };

  const handleToggle = async () => {
    if (!toggling) return;
    setTogglePending(true);
    try {
      const saved = await updateSchool(toggling.id, { is_active: !toggling.is_active });
      setSchools((current) => current.map((school) => (school.id === saved.id ? saved : school)));
      toast.success(saved.is_active ? "School activated." : "School deactivated.");
      setToggling(null);
    } catch (err) {
      toast.error(errorText(err, "We couldn’t change the school status."));
    } finally {
      setTogglePending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-link">
            Super administrator
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">
            Schools
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Create schools, rename them, and turn their access on or off.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add School
        </button>
      </header>

      {loading ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2">
          <span className="sr-only">Loading schools</span>
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-panel border border-line bg-bg"
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-panel border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h2 className="font-semibold text-ink">We couldn&apos;t load schools.</h2>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : schools.length === 0 ? (
        <div className="rounded-panel border border-line bg-bg p-8 text-center">
          <Building2 className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-ink">No schools yet.</h2>
        </div>
      ) : (
        <section aria-label="Schools">
          <p className="mb-3 text-sm text-muted">
            {schools.length} school{schools.length === 1 ? "" : "s"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {schools.map((school) => (
              <li
                key={school.id}
                className="rounded-panel border border-line bg-bg p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words font-semibold text-ink">
                    {school.name}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      school.is_active
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-surface text-ink  "
                    }`}
                  >
                    {school.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Created {formatTimestamp(school.created_at)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(school)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong px-3 py-2 text-sm font-semibold text-ink hover:bg-surface"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit name
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggling(school)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold  ${
                      school.is_active
                        ? "border border-red-300 text-red-700 hover:bg-red-50  dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        : "border border-emerald-300 text-emerald-800 hover:bg-emerald-50  dark:border-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-950/30"
                    }`}
                  >
                    <Power className="h-4 w-4" aria-hidden="true" />
                    {school.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <SchoolNameDialog
          school={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={saveSchool}
        />
      )}

      {toggling && (
        <ConfirmDialog
          title={toggling.is_active ? `Deactivate ${toggling.name}?` : `Activate ${toggling.name}?`}
          description={
            toggling.is_active
              ? "Everyone in this school is signed out and can no longer sign in, and its edge devices can no longer send alerts. Super administrators are not affected. You can activate the school again later."
              : "Users in this school can sign in again and its edge devices can send alerts again."
          }
          confirmLabel={toggling.is_active ? "Deactivate school" : "Activate school"}
          tone={toggling.is_active ? "danger" : "primary"}
          pending={togglePending}
          onCancel={() => setToggling(null)}
          onConfirm={() => void handleToggle()}
        />
      )}
    </div>
  );
}
