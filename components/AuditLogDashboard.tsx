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
      <span className="font-semibold text-sev-medium">
        {label}
      </span>
    );
  }

  return <time dateTime={new Date(timestamp).toISOString()}>{label}</time>;
}

function StatusBadge({ status }: { status: AuditLogStatus | null }) {
  if (status === "SUCCESS") {
    return (
      <span className="inline-flex rounded-tag border border-line-strong bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
        Success
      </span>
    );
  }
  if (status === "FAILURE") {
    return (
      <span className="inline-flex rounded-tag border border-danger/40 bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger">
        Failure
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-tag border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
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
      className={`rounded-control border border-line bg-surface p-3   ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <dt className="text-xs font-semibold text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-ink">
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
      <p className="text-sm text-muted">
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
            className="rounded-control border border-line bg-bg p-3"
          >
            <dt className="break-all text-xs font-semibold text-muted">
              {key}
            </dt>
            <dd className="mt-1">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-ink">
                {typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)}
              </pre>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted">
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
          className="h-20 animate-pulse rounded-panel border border-line bg-bg"
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


  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p id="audit-export-help" className="max-w-2xl text-body text-muted">
          Sign-ins, account changes and setting changes. This history can&apos;t be edited. Download CSV includes every
          record matching the filters, not only this page.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-bg px-4 text-body font-medium text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={loading || exporting || !page || page.total === 0}
            aria-describedby="audit-export-help"
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-bg px-4 text-body font-medium text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            {exporting ? "Preparing…" : "Download CSV"}
          </button>
        </div>
      </div>
      {exportError && (
        <p role="alert" className="mb-4 text-body font-medium text-danger">
          The CSV couldn&apos;t be prepared. Try again, or narrow the filters.
        </p>
      )}

      <section
        aria-labelledby="audit-filters-heading"
        className="rounded-panel border border-line bg-bg p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="audit-filters-heading"
            className="text-base font-semibold text-ink"
          >
            Filter audit history
          </h2>
          {activeFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-link hover:bg-surface"
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
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="audit-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search user, action, resource, target"
                className="min-h-11 w-full rounded-control border border-line-strong bg-bg py-2 pl-10 pr-11 text-sm text-ink placeholder:text-muted"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear audit history search"
                  className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-control text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Search updates after a short pause and resets to page 1.
            </p>
          </div>

          <div>
            <label
              htmlFor="audit-date-from"
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="audit-date-to"
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="audit-user"
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="audit-action"
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="audit-resource"
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="audit-sort"
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="audit-role"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Role
            </label>
            <select
              id="audit-role"
              value={filters.actor_role}
              onChange={(event) =>
                updateFilters({ actor_role: event.target.value })
              }
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
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
              className="mb-1.5 block text-sm font-semibold text-ink"
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
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
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
              className="font-semibold text-ink"
            >
              Recorded activity
            </h2>
            <p
              className="mt-1 text-sm text-muted"
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
            <p className="text-xs text-muted">
              Refreshed {formatTimestamp(lastUpdated)}
            </p>
          )}
        </div>

        {loading ? (
          <AuditLogSkeleton />
        ) : errorStatus !== null ? (
          <div
            role="alert"
            className="rounded-panel border border-danger/40 bg-danger-bg p-6"
          >
            <h3 className="font-semibold text-ink">
              {errorStatus === 403
                ? "You do not have permission to view audit history."
                : "We couldn't load audit history."}
            </h3>
            <p className="mt-2 text-sm text-danger">
              {errorStatus === 403
                ? "Sign in with an administrator account."
                : "Check the connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => void loadLogs()}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-panel border border-line bg-bg p-8 text-center">
            <ClipboardList
              className="mx-auto h-8 w-8 text-muted"
              aria-hidden="true"
            />
            <h3 className="mt-3 font-semibold text-ink">
              {activeFilters
                ? "No audit activity was found for the selected filters."
                : "No audit activity has been recorded yet."}
            </h3>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-panel border border-line bg-bg xl:block">
              <table className="w-full table-fixed border-collapse text-left text-small">
                <caption className="sr-only">
                  Administrative audit history with a dedicated details action
                  for each record.
                </caption>
                <thead className="bg-surface text-ink">
                  <tr>
                    <th scope="col" className="w-44 px-3 py-2.5 font-medium">
                      Timestamp
                    </th>
                    <th scope="col" className="w-52 px-3 py-2.5 font-medium">
                      User
                    </th>
                    <th
                      scope="col"
                      className="hidden w-32 px-3 py-2.5 font-medium xl:table-cell"
                    >
                      Role
                    </th>
                    <th scope="col" className="w-32 px-3 py-2.5 font-medium">
                      Action
                    </th>
                    <th scope="col" className="w-28 px-3 py-2.5 font-medium">
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="hidden w-40 px-3 py-2.5 font-medium xl:table-cell"
                    >
                      Target
                    </th>
                    <th scope="col" className="w-28 px-3 py-2.5 font-medium">
                      Status
                    </th>
                    <th scope="col" className="w-28 px-3 py-2.5 font-medium">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {records.map((log) => (
                    <tr
                      key={log.id}
                      className="align-top hover:bg-surface"
                    >
                      <td className="px-3 py-2.5 text-ink">
                        <AuditTimestamp
                          value={log.occurred_at}
                          recordId={log.id}
                        />
                      </td>
                      <td className="break-words px-3 py-2.5 font-medium text-ink">
                        {log.actor_email ?? "Unknown user"}
                      </td>
                      <td className="hidden px-3 py-2.5 text-ink xl:table-cell">
                        {formatAuditRole(log.actor_role)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex rounded-full bg-surface px-2.5 py-1 font-semibold text-ink">
                          {formatAuditAction(log.action)}
                        </span>
                      </td>
                      <td className="break-words px-3 py-2.5 text-ink">
                        {log.resource}
                      </td>
                      <td className="hidden break-words px-3 py-2.5 text-ink xl:table-cell">
                        {log.target ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-control px-3 py-2 font-semibold text-link hover:bg-surface"
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
                  className="rounded-panel border border-line bg-bg p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                        {formatAuditAction(log.action)}
                      </span>
                      <h3 className="mt-3 break-words font-semibold text-ink">
                        {log.resource}
                      </h3>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-muted">
                        Timestamp
                      </dt>
                      <dd className="mt-1 text-ink">
                        <AuditTimestamp
                          value={log.occurred_at}
                          recordId={log.id}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted">
                        User
                      </dt>
                      <dd className="mt-1 break-words text-ink">
                        {log.actor_email ?? "Unknown user"}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-line px-4 py-2 text-sm font-semibold text-link hover:bg-surface"
                  >
                    View details
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            <nav
              aria-label="Audit history pagination"
              className="mt-4 flex flex-col gap-3 rounded-panel border border-line bg-bg p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm text-muted">
                Page <strong>{page?.page ?? 1}</strong> of{" "}
                <strong>{Math.max(1, page?.total_pages ?? 0)}</strong> ·{" "}
                <strong>{page?.total ?? 0}</strong> matching record
                {page?.total === 1 ? "" : "s"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="audit-page-size"
                  className="text-sm font-semibold text-ink"
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
                  className="min-h-11 rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
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
                  className="inline-flex min-h-11 items-center gap-1 rounded-control border border-line-strong px-3 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="inline-flex min-h-11 items-center gap-1 rounded-control border border-line-strong px-3 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
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
              <span className="mt-1 block font-mono text-xs text-muted">
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
