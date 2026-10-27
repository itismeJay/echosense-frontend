"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, FlaskConical, RotateCcw } from "lucide-react";
import AlertEvidence from "@/components/AlertEvidence";
import { Button, Detail, ErrorState, LoadingRows, Note, Page } from "@/components/ui";
import { OutsideHoursTag, ReviewState, SeverityTag } from "@/components/ui/status";
import {
  REQUIRED_REVIEW_NOTICE,
  classroomLabel,
  deliveryStatusLabel,
  isTestAlert,
  noWordsReason,
  pushStatusLabel,
  schoolLabel,
  severitySummary,
  triggerTypeLabel,
  wordsHeard,
} from "@/lib/alert-presentation";
import { ApiError, getAlert } from "@/lib/api";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatTimestamp } from "@/lib/format";
import { useReviewAlert } from "@/lib/useReviewAlert";
import type { Alert } from "@/lib/types";

function BackLink() {
  return (
    <Link
      href="/alerts"
      className="inline-flex min-h-11 items-center gap-2 rounded-control text-body font-medium text-ink hover:underline"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to alerts
    </Link>
  );
}

function timestamp(value: string | null | undefined): string {
  return value ? formatTimestamp(value) : "Not recorded";
}

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const { alerts } = useAlerts();
  const { setStatus, pendingId } = useReviewAlert();
  const alertId = Number(params.id);
  const providerAlert = Number.isInteger(alertId) ? alerts.find((item) => item.id === alertId) : undefined;
  const [alert, setAlert] = useState<Alert | undefined>(providerAlert);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const requestInFlightRef = useRef(false);

  const loadAlert = useCallback(async () => {
    if (requestInFlightRef.current) return;
    if (!Number.isInteger(alertId) || alertId < 1) {
      setAlert(undefined);
      setErrorStatus(404);
      setLoading(false);
      return;
    }
    requestInFlightRef.current = true;
    setErrorStatus(null);
    try {
      setAlert(await getAlert(alertId));
    } catch (error) {
      setErrorStatus(error instanceof ApiError ? error.status : 500);
    } finally {
      setLoading(false);
      requestInFlightRef.current = false;
    }
  }, [alertId]);

  useEffect(() => {
    const timer = setTimeout(() => void loadAlert(), 0);
    const interval = setInterval(() => void loadAlert(), 10_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadAlert]);

  const changeStatus = async (status: "active" | "reviewed" | "resolved") => {
    if (!alert) return;
    const updated = await setStatus(alert, status);
    if (updated) setAlert(updated);
  };

  if (loading && !alert) {
    return (
      <Page>
        <BackLink />
        <div className="mt-6 rounded-panel border border-line">
          <LoadingRows rows={4} label="Loading alert" />
        </div>
      </Page>
    );
  }

  if (errorStatus !== null && errorStatus !== 404 && (!alert || errorStatus === 401 || errorStatus === 403)) {
    const forbidden = errorStatus === 403;
    const unauthorized = errorStatus === 401;
    return (
      <Page>
        <BackLink />
        <div className="mt-6 max-w-2xl">
          <ErrorState
            title={
              unauthorized
                ? "Your session is no longer authorized."
                : forbidden
                  ? "You do not have permission to view this alert."
                  : "We couldn’t load this classroom alert."
            }
            onRetry={!forbidden && !unauthorized ? () => void loadAlert() : undefined}
            retryLabel="Retry"
          >
            {unauthorized
              ? "Sign in again to continue."
              : forbidden
                ? "Alerts from other schools are hidden. Ask your school administrator if you need access."
                : "EchoSense may be busy. Check the internet connection, then select Retry."}
          </ErrorState>
        </div>
      </Page>
    );
  }

  if (errorStatus === 404 || !alert) {
    return (
      <Page>
        <BackLink />
        <div className="mt-6 max-w-2xl">
          <h1 className="text-display font-semibold text-ink">Alert not found</h1>
          <p className="mt-2 text-body-lg text-muted">
            This alert may belong to another school, or the link is incomplete. Go back to Alerts to find it in the
            list.
          </p>
        </div>
      </Page>
    );
  }

  const words = wordsHeard(alert, 12);
  const pending = pendingId === alert.id;

  return (
    <Page className="max-w-[960px]">
      <BackLink />

      {isTestAlert(alert) && (
        <div className="mt-4 flex items-start gap-3 rounded-panel border-2 border-ink p-4">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-body-lg font-semibold text-ink">Test alert, not a real incident</p>
            <p className="text-body text-muted">Sent to check that alerts reach this dashboard.</p>
          </div>
        </div>
      )}

      <header className="mt-4 border-b border-line pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <SeverityTag severity={alert.severity} />
          <ReviewState status={alert.status} />
          {alert.outside_school_hours && <OutsideHoursTag />}
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-display font-semibold text-ink">{classroomLabel(alert)}</h1>
            <p className="num mt-1 text-body-lg text-muted">
              {formatTimestamp(alert.trigger_timestamp ?? alert.event_start_timestamp ?? alert.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {alert.status === "active" || alert.status === "unknown" ? (
              <>
                <Button variant="primary" icon={Check} pending={pending} onClick={() => void changeStatus("reviewed")}>
                  Mark reviewed
                </Button>
                <Button icon={CheckCheck} disabled={pending} onClick={() => void changeStatus("resolved")}>
                  Mark resolved
                </Button>
              </>
            ) : (
              <>
                {alert.status === "reviewed" && (
                  <Button variant="primary" icon={CheckCheck} pending={pending} onClick={() => void changeStatus("resolved")}>
                    Mark resolved
                  </Button>
                )}
                <Button icon={RotateCcw} disabled={pending} onClick={() => void changeStatus("active")}>
                  Move back to Needs review
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Note>{alert.review_message || REQUIRED_REVIEW_NOTICE}</Note>
        </div>
      </header>

      {errorStatus !== null && (
        <p role="status" className="mt-4 text-body text-muted">
          The newest details couldn&apos;t be loaded. What you see came from the alert list a moment ago.
        </p>
      )}

      <section aria-labelledby="heard-title" className="mt-6">
        <h2 id="heard-title" className="text-title font-semibold text-ink">
          What was heard
        </h2>
        <p className="mt-1 text-body text-muted">{severitySummary(alert.severity)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {words.length > 0 ? (
            words.map((word) => (
              <span key={word} className="rounded-tag bg-surface px-2 py-1 text-body-lg text-ink">
                “{word}”
              </span>
            ))
          ) : (
            <span className="text-body-lg text-muted">{noWordsReason(alert)}</span>
          )}
        </div>
      </section>

      <section className="mt-6" aria-label="Alert information">
        <AlertEvidence alert={alert} defaultExpanded hideToggle part="summary" />
      </section>

      <details className="group mt-6 rounded-panel border border-line">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-body-lg font-medium text-ink sm:px-5">
          Technical details
          <span aria-hidden="true" className="text-muted group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-line px-4 py-4 sm:px-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Alert ID">
              <span className="num">{alert.id}</span>
            </Detail>
            <Detail label="Event ID">
              <span className="break-all">{alert.event_id ?? "Not recorded for this alert"}</span>
            </Detail>
            <Detail label="School">{schoolLabel(alert)}</Detail>
            <Detail label="Device">
              {alert.device_display_name || alert.device_code || alert.device_id || "Device not recorded"}
              {alert.device_code && alert.device_display_name ? ` (${alert.device_code})` : ""}
            </Detail>
            <Detail label="What triggered it">
              {triggerTypeLabel(alert)}, schema version {alert.schema_version ?? "legacy"}
            </Detail>
            <Detail label="Delivery and phone notifications">
              Delivery: {deliveryStatusLabel(alert)}. Phone notification: {pushStatusLabel(alert)}.
            </Detail>
          </dl>
          <section className="mt-5" aria-labelledby="event-timeline-title">
            <h3 id="event-timeline-title" className="text-body font-semibold text-ink">
              Event timeline
            </h3>
            <dl className="mt-2 grid gap-4 sm:grid-cols-3">
              <Detail label="Sound started">
                <span className="num">{timestamp(alert.event_start_timestamp)}</span>
              </Detail>
              <Detail label="Alert triggered">
                <span className="num">{timestamp(alert.trigger_timestamp)}</span>
              </Detail>
              <Detail label="Sound ended">
                <span className="num">{timestamp(alert.event_end_timestamp)}</span>
              </Detail>
            </dl>
          </section>
          <div className="mt-6 border-t border-line pt-5">
            <AlertEvidence alert={alert} defaultExpanded hideToggle part="technical" />
          </div>
        </div>
      </details>
    </Page>
  );
}
