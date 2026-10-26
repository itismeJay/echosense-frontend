"use client";

import { useMemo, useState } from "react";
import { BellRing, ChevronLeft, ChevronRight, Download, SearchX } from "lucide-react";
import AlertInbox from "@/components/AlertInbox";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingRows,
  Page,
  PageHeader,
  TabLinks,
  inputClass,
  labelClass,
  selectClass,
} from "@/components/ui";
import { useAlerts } from "@/lib/AlertsProvider";
import {
  classroomLabel,
  deliveryStatusLabel,
  eventTime,
  isTestAlert,
  monitoredTermCount,
  needsReview,
  pushStatusLabel,
  reviewStatusLabel,
  schoolLabel,
  triggerTypeLabel,
} from "@/lib/alert-presentation";
import { csvEscape } from "@/lib/format";
import type { Alert, Severity } from "@/lib/types";

const PAGE_SIZE = 25;

type SeverityFilter = "all" | Severity;

/** Local calendar date (yyyy-mm-dd) for a timestamp, matching <input type="date">. */
function localDate(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function downloadCsv(alerts: Alert[]) {
  // Deliberately no transcript or raw evidence: exports leave the system.
  const headers = [
    "ID",
    "Severity",
    "Trigger Type",
    "Test Alert",
    "Classroom",
    "School",
    "Review Status",
    "Monitored-term Occurrences",
    "Delivery Status",
    "Push Status",
    "Event Time",
  ];
  const rows = alerts.map((alert) => [
    alert.id,
    alert.severity,
    csvEscape(triggerTypeLabel(alert)),
    isTestAlert(alert) ? "Yes, test data" : "No",
    csvEscape(classroomLabel(alert)),
    csvEscape(schoolLabel(alert)),
    csvEscape(reviewStatusLabel(alert)),
    monitoredTermCount(alert),
    csvEscape(deliveryStatusLabel(alert)),
    csvEscape(pushStatusLabel(alert)),
    eventTime(alert),
  ]);
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `echosense-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AlertsView({
  tab,
  initialClassroom = "",
}: {
  tab: "review" | "all";
  /** Preselects the classroom filter, e.g. from a classroom page's "See its alerts" link. */
  initialClassroom?: string;
}) {
  const { alerts, loading, error, errorStatus, warning, refresh } = useAlerts();
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [classroom, setClassroom] = useState(initialClassroom);
  const [page, setPage] = useState(0);

  const waitingCount = alerts.filter(needsReview).length;
  const classrooms = useMemo(
    () =>
      [...new Set([...alerts.map(classroomLabel), ...(initialClassroom ? [initialClassroom] : [])])].sort((a, b) =>
        a.localeCompare(b)
      ),
    [alerts, initialClassroom]
  );

  const filtered = useMemo(() => {
    return alerts.filter((alert) => {
      if (tab === "review" && !needsReview(alert)) return false;
      if (severity !== "all" && alert.severity !== severity) return false;
      if (classroom && classroomLabel(alert) !== classroom) return false;
      const day = localDate(alert.created_at);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [alerts, tab, severity, classroom, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const filtersActive = severity !== "all" || from !== "" || to !== "" || classroom !== "";

  const resetFilters = () => {
    setSeverity("all");
    setFrom("");
    setTo("");
    setClassroom("");
    setPage(0);
  };

  const onFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  return (
    <Page>
      <PageHeader
        title="Alerts"
        description="Possible concerns picked up by classroom devices. Each one needs a person to check what happened."
        actions={
          tab === "all" && (
            <Button icon={Download} onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>
              Download CSV
            </Button>
          )
        }
      />

      <TabLinks
        label="Alert lists"
        current={tab === "review" ? "/alerts" : "/alerts/all"}
        tabs={[
          { href: "/alerts", label: "Needs review", count: waitingCount },
          { href: "/alerts/all", label: "All alerts" },
        ]}
      />

      <section aria-label="Filters" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-[10rem_10rem_10rem_minmax(10rem,14rem)_auto] md:items-end">
        <div>
          <label htmlFor="filter-severity" className={labelClass}>
            Severity
          </label>
          <select
            id="filter-severity"
            value={severity}
            onChange={(event) => onFilter(setSeverity)(event.target.value as SeverityFilter)}
            className={selectClass}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-classroom" className={labelClass}>
            Classroom
          </label>
          <select
            id="filter-classroom"
            value={classroom}
            onChange={(event) => onFilter(setClassroom)(event.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            {classrooms.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-from" className={labelClass}>
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => onFilter(setFrom)(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="filter-to" className={labelClass}>
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => onFilter(setTo)(event.target.value)}
            className={inputClass}
          />
        </div>
        {filtersActive && (
          <div className="col-span-2 md:col-span-1">
            <Button variant="ghost" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </section>

      {warning && (
        <p role="status" className="mb-3 text-body text-muted">
          {warning}
        </p>
      )}

      {error && alerts.length === 0 ? (
        <ErrorState
          title={errorStatus === 403 ? "Your account can't view alerts" : "EchoSense can't load alerts right now"}
          onRetry={errorStatus === 403 ? undefined : () => void refresh()}
        >
          {errorStatus === 403
            ? "Ask your school administrator to check your account."
            : "Check the internet connection. The list updates by itself once EchoSense is reachable."}
        </ErrorState>
      ) : loading ? (
        <div className="rounded-panel border border-line">
          <LoadingRows rows={5} label="Loading alerts" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-panel border border-line">
          {filtersActive ? (
            <EmptyState
              title="No alerts match these filters"
              icon={SearchX}
              action={<Button onClick={resetFilters}>Clear filters</Button>}
            >
              Try a wider date range or a different classroom.
            </EmptyState>
          ) : tab === "review" ? (
            <EmptyState title="No alerts need review" icon={BellRing}>
              Everything has been looked at. New alerts appear here within a few seconds.
            </EmptyState>
          ) : (
            <EmptyState title="No alerts yet" icon={BellRing}>
              Alerts appear here when a classroom device picks up a possible concern.
            </EmptyState>
          )}
        </div>
      ) : (
        <>
          <AlertInbox alerts={shown} mode={tab} label={tab === "review" ? "Alerts that need review" : "All alerts"} />
          <nav aria-label="Pages" className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="num text-body text-muted" aria-live="polite">
              {currentPage * PAGE_SIZE + 1}–{Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE)} of{" "}
              {filtered.length}
            </p>
            {pageCount > 1 && (
              <div className="flex gap-2">
                <Button size="sm" icon={ChevronLeft} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                  Previous
                </Button>
                <Button
                  size="sm"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </nav>
        </>
      )}
    </Page>
  );
}
