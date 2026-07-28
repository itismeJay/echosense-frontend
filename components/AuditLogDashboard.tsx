"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Info,
  LockKeyhole,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import {
  auditFiltersFromSearchParams,
  auditFiltersToSearchParams,
  DEFAULT_AUDIT_FILTERS,
  formatAuditAction,
  formatAuditRole,
  sanitizeAuditMetadata,
} from "@/lib/audit-log";
import {
  ApiError,
  exportAuditLogs,
  getAuditLogs,
} from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { formatTimestamp } from "@/lib/format";
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogListResponse,
  AuditLogStatus,
} from "@/lib/types";

function AuditTimestamp({
  value,
  recordId,
}: {
  value: string | null;
  recordId: string;
}) {
  const timestamp =
    value && !Number.isNaN(Date.parse(value)) ? Date.parse(value) : null;
  const label = formatTimestamp(value, {
    recordId,
    field: "occurred_at",
  });

  if (timestamp === null) {
    return (
      <span className="font-semibold text-amber-700 dark:text-amber-300">
        {label}
      </span>
    );
  }

  return <time dateTime={new Date(timestamp).toISOString()}>{label}</time>;
}

function StatusBadge({ status }: { status: AuditLogStatus | null }) {
  if (status === "SUCCESS") {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        Success
      </span>
    );
  }
  if (status === "FAILURE") {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Failure
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      Status unavailable
    </span>
  );
}

function DetailItem({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-slate-900 dark:text-slate-100">
        {children}
      </dd>
    </div>
  );
}

function MetadataDetails({
  metadata,
}: {
  metadata: Record<string, unknown> | null;
}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No metadata is available.
      </p>
    );
  }

  const safeMetadata = sanitizeAuditMetadata(metadata) as Record<
    string,
    unknown
  >;

  return (
    <div>
      <dl className="space-y-2">
        {Object.entries(safeMetadata).map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
          >
            <dt className="break-all text-xs font-semibold text-slate-600 dark:text-slate-300">
              {key}
            </dt>
            <dd className="mt-1">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-slate-800 dark:text-slate-100">
                {typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)}
              </pre>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Sensitive metadata keys are redacted in this view and in CSV exports.
      </p>
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <div role="status" aria-label="Loading audit history" className="space-y-3">
      <span className="sr-only">Loading audit history</span>
      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        />
      ))}
    </div>
  );
}

function hasSelectedFilters(filters: AuditLogFilters): boolean {
  return (
    Boolean(filters.search) ||
    Boolean(filters.actor_email) ||
    Boolean(filters.actor_role) ||
    Boolean(filters.action) ||
    Boolean(filters.resource) ||
    Boolean(filters.status) ||
    Boolean(filters.date_from) ||
    Boolean(filters.date_to) ||
    filters.sort_order !== "desc"
  );
}

export default function AuditLogDashboard() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState<AuditLogListResponse | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>(() =>
    auditFiltersFromSearchParams(searchParams)
  );
  const [searchInput, setSearchInput] = useState(filters.search);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const replaceFilterUrl = useCallback(
    (nextFilters: AuditLogFilters) => {
      const query = auditFiltersToSearchParams(nextFilters).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router]
  );

  const updateFilters = useCallback(
    (
      patch: Partial<AuditLogFilters>,
      options: { resetPage?: boolean } = { resetPage: true }
    ) => {
      const nextFilters = {
        ...filters,
        ...patch,
        page: options.resetPage === false ? patch.page ?? filters.page : 1,
      };
      setFilters(nextFilters);
      replaceFilterUrl(nextFilters);
    },
    [filters, replaceFilterUrl]
  );

  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search, searchInput, updateFilters]);

  const loadLogs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const response = await getAuditLogs(filters, signal);
      setPage(response);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPage(null);
      setErrorStatus(error instanceof ApiError ? error.status : 500);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void loadLogs(controller.signal);
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadLogs]);

  const activeFilters = hasSelectedFilters(filters);
  const records = page?.items ?? [];

  const resetFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_AUDIT_FILTERS);
    replaceFilterUrl(DEFAULT_AUDIT_FILTERS);
  };

  const handleExport = async () => {
    if (exporting || !page || page.total === 0) return;
    setExporting(true);
    setExportError(false);
    try {
      const { blob, filename } = await exportAuditLogs(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename ??
        `echosense-audit-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-[100rem] p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Administrator
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
              Audit History
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review important account, security, and administrative activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Administrator only · Read only
            </span>
            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={loading || exporting || !page || page.total === 0}
              aria-label="Export all audit records matching the selected filters as CSV"
              aria-describedby="audit-export-help"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-slate-950"
            >
              {exporting ? (
                <RefreshCw
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              {exporting ? "Preparing…" : "Export CSV"}
            </button>
          </div>
        </div>
        <p
          id="audit-export-help"
          className="mt-2 text-xs text-slate-500 dark:text-slate-400"
        >
          Filters, sorting, pagination, and CSV export are applied by the
          backend. Export includes the records matching the selected filters,
          not only the page currently shown.
        </p>
        {exportError && (
          <p
            role="alert"
            className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300"
          >
            We couldn&apos;t prepare the CSV export. Please try again.
          </p>
        )}
      </header>

      <div
        role="note"
        className="mb-5 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Audit History is read-only and separate from Technical Logs. Missing
          legacy values are displayed as unavailable rather than being
          fabricated.
        </p>
      </div>

      <section
        aria-labelledby="audit-filters-heading"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="audit-filters-heading"
            className="text-base font-bold text-slate-950 dark:text-white"
          >
            Filter audit history
          </h2>
          {activeFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Reset filters
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="audit-search"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="audit-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search user, action, resource, target"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-11 text-sm text-slate-950 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear audit history search"
                  className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Search updates after a short pause and resets to page 1.
            </p>
          </div>

          <div>
            <label
              htmlFor="audit-date-from"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Date from
            </label>
            <input
              id="audit-date-from"
              type="date"
              value={filters.date_from}
              max={filters.date_to || undefined}
              onChange={(event) =>
                updateFilters({ date_from: event.target.value })
              }
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="audit-date-to"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Date to
            </label>
            <input
              id="audit-date-to"
              type="date"
              value={filters.date_to}
              min={filters.date_from || undefined}
              onChange={(event) =>
                updateFilters({ date_to: event.target.value })
              }
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="audit-user"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              User or email
            </label>
            <input
              id="audit-user"
              type="text"
              value={filters.actor_email}
              onChange={(event) =>
                updateFilters({ actor_email: event.target.value })
              }
              placeholder="admin@school.edu"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="audit-action"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Action
            </label>
            <input
              id="audit-action"
              type="text"
              value={filters.action}
              onChange={(event) =>
                updateFilters({ action: event.target.value })
              }
              placeholder="LOGIN"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="audit-resource"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Resource
            </label>
            <input
              id="audit-resource"
              type="text"
              value={filters.resource}
              onChange={(event) =>
                updateFilters({ resource: event.target.value })
              }
              placeholder="Authentication"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="audit-sort"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Sort order
            </label>
            <select
              id="audit-sort"
              value={filters.sort_order}
              onChange={(event) =>
                updateFilters({
                  sort_order: event.target.value as "asc" | "desc",
                })
              }
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="audit-role"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Role
            </label>
            <select
              id="audit-role"
              value={filters.actor_role}
              onChange={(event) =>
                updateFilters({ actor_role: event.target.value })
              }
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All roles</option>
              <option value="admin">Administrator</option>
              <option value="staff">Staff</option>
              <option value="counselor">Counselor</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="audit-status"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Status
            </label>
            <select
              id="audit-status"
              value={filters.status}
              onChange={(event) =>
                updateFilters({
                  status: event.target.value as AuditLogStatus | "",
                })
              }
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mt-5" aria-labelledby="audit-results-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="audit-results-heading"
              className="font-bold text-slate-950 dark:text-white"
            >
              Recorded activity
            </h2>
            <p
              className="mt-1 text-sm text-slate-600 dark:text-slate-300"
              aria-live="polite"
            >
              {loading
                ? "Loading records…"
                : `${page?.total ?? 0} matching record${
                    page?.total === 1 ? "" : "s"
                  }`}
            </p>
          </div>
          {lastUpdated && !loading && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Refreshed {formatTimestamp(lastUpdated)}
            </p>
          )}
        </div>

        {loading ? (
          <AuditLogSkeleton />
        ) : errorStatus !== null ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
          >
            <h3 className="font-bold text-red-950 dark:text-red-100">
              {errorStatus === 403
                ? "You do not have permission to view audit history."
                : "We couldn't load audit history."}
            </h3>
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">
              {errorStatus === 403
                ? "Sign in with an administrator account."
                : "Check the connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => void loadLogs()}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <ClipboardList
              className="mx-auto h-8 w-8 text-slate-500"
              aria-hidden="true"
            />
            <h3 className="mt-3 font-bold text-slate-950 dark:text-white">
              {activeFilters
                ? "No audit activity was found for the selected filters."
                : "No audit activity has been recorded yet."}
            </h3>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <caption className="sr-only">
                  Administrative audit history with a dedicated details action
                  for each record.
                </caption>
                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th scope="col" className="w-44 px-3 py-3 font-bold">
                      Timestamp
                    </th>
                    <th scope="col" className="w-48 px-3 py-3 font-bold">
                      User
                    </th>
                    <th
                      scope="col"
                      className="hidden w-32 px-3 py-3 font-bold xl:table-cell"
                    >
                      Role
                    </th>
                    <th scope="col" className="w-40 px-3 py-3 font-bold">
                      Action
                    </th>
                    <th scope="col" className="w-36 px-3 py-3 font-bold">
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="hidden w-40 px-3 py-3 font-bold xl:table-cell"
                    >
                      Target
                    </th>
                    <th scope="col" className="w-36 px-3 py-3 font-bold">
                      Status
                    </th>
                    <th scope="col" className="w-28 px-3 py-3 font-bold">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((log) => (
                    <tr
                      key={log.id}
                      className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-4 text-slate-700 dark:text-slate-200">
                        <AuditTimestamp
                          value={log.occurred_at}
                          recordId={log.id}
                        />
                      </td>
                      <td className="break-words px-3 py-4 font-medium text-slate-950 dark:text-white">
                        {log.actor_email ?? "Unknown user"}
                      </td>
                      <td className="hidden px-3 py-4 text-slate-700 xl:table-cell dark:text-slate-200">
                        {formatAuditRole(log.actor_role)}
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                          {formatAuditAction(log.action)}
                        </span>
                      </td>
                      <td className="break-words px-3 py-4 text-slate-700 dark:text-slate-200">
                        {log.resource}
                      </td>
                      <td className="hidden break-words px-3 py-4 text-slate-700 xl:table-cell dark:text-slate-200">
                        {log.target ?? "—"}
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                          aria-label={`View details for ${formatAuditAction(
                            log.action
                          )} audit record ${log.id}`}
                        >
                          View
                          <ChevronRight
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 xl:hidden" aria-label="Audit records">
              {records.map((log) => (
                <article
                  key={log.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                        {formatAuditAction(log.action)}
                      </span>
                      <h3 className="mt-3 break-words font-bold text-slate-950 dark:text-white">
                        {log.resource}
                      </h3>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Timestamp
                      </dt>
                      <dd className="mt-1 text-slate-800 dark:text-slate-100">
                        <AuditTimestamp
                          value={log.occurred_at}
                          recordId={log.id}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        User
                      </dt>
                      <dd className="mt-1 break-words text-slate-800 dark:text-slate-100">
                        {log.actor_email ?? "Unknown user"}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                  >
                    View details
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            <nav
              aria-label="Audit history pagination"
              className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Page <strong>{page?.page ?? 1}</strong> of{" "}
                <strong>{Math.max(1, page?.total_pages ?? 0)}</strong> ·{" "}
                <strong>{page?.total ?? 0}</strong> matching record
                {page?.total === 1 ? "" : "s"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="audit-page-size"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Per page
                </label>
                <select
                  id="audit-page-size"
                  value={filters.page_size}
                  onChange={(event) =>
                    updateFilters({
                      page_size: Number(event.target.value),
                    })
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    updateFilters(
                      { page: (page?.page ?? 1) - 1 },
                      { resetPage: false }
                    )
                  }
                  disabled={!page || page.page === 1}
                  aria-label="Go to previous audit history page"
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateFilters(
                      { page: (page?.page ?? 1) + 1 },
                      { resetPage: false }
                    )
                  }
                  disabled={
                    !page ||
                    page.total_pages === 0 ||
                    page.page >= page.total_pages
                  }
                  aria-label="Go to next audit history page"
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>

      {selectedLog && (
        <AccessibleDialog
          title="Audit record details"
          description={`Read-only audit record ${selectedLog.id}. Missing values were not returned by the backend.`}
          onClose={() => setSelectedLog(null)}
          size="large"
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Local timestamp">
              <AuditTimestamp
                value={selectedLog.occurred_at}
                recordId={selectedLog.id}
              />
            </DetailItem>
            <DetailItem label="Original timestamp">
              {selectedLog.occurred_at ?? "Not available"}
            </DetailItem>
            <DetailItem label="User">
              {selectedLog.actor_email ?? "Unknown user"}
            </DetailItem>
            <DetailItem label="User ID">
              {selectedLog.actor_user_id ?? "Not available"}
            </DetailItem>
            <DetailItem label="Role">
              {formatAuditRole(selectedLog.actor_role)}
            </DetailItem>
            <DetailItem label="Action">
              <span className="font-semibold">
                {formatAuditAction(selectedLog.action)}
              </span>
              <span className="mt-1 block font-mono text-xs text-slate-500 dark:text-slate-400">
                {selectedLog.action}
              </span>
            </DetailItem>
            <DetailItem label="Resource">{selectedLog.resource}</DetailItem>
            <DetailItem label="Resource ID">
              {selectedLog.resource_id ?? "Not available"}
            </DetailItem>
            <DetailItem label="Target">
              {selectedLog.target ?? "—"}
            </DetailItem>
            <DetailItem label="Status">
              <StatusBadge status={selectedLog.status} />
            </DetailItem>
            <DetailItem label="Description" fullWidth>
              {selectedLog.description ?? "No additional details"}
            </DetailItem>
            <DetailItem label="IP address">
              {selectedLog.ip_address ?? "Not available"}
            </DetailItem>
            <DetailItem label="Request ID">
              {selectedLog.request_id ?? "Not available"}
            </DetailItem>
            <DetailItem label="User agent" fullWidth>
              {selectedLog.user_agent ?? "Not available"}
            </DetailItem>
            <DetailItem label="Created at" fullWidth>
              {selectedLog.created_at
                ? formatTimestamp(selectedLog.created_at, {
                    recordId: selectedLog.id,
                    field: "created_at",
                  })
                : "Not available"}
            </DetailItem>
            <DetailItem label="Metadata" fullWidth>
              <MetadataDetails metadata={selectedLog.metadata} />
            </DetailItem>
          </dl>
        </AccessibleDialog>
      )}
    </div>
  );
}
