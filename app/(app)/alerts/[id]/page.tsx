"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, FlaskConical, RotateCcw } from "lucide-react";
import AlertEvidence from "@/components/AlertEvidence";
import ReviewOutcomeDialog from "@/components/ReviewOutcomeDialog";
import LanguageBadge from "@/components/LanguageBadge";
import TranscriptQuote from "@/components/TranscriptQuote";
import { Button, Detail, ErrorState, LoadingRows, Note, Page } from "@/components/ui";
import { OutsideHoursTag, ReviewState, SeverityTag } from "@/components/ui/status";
import {
  SHORT_REVIEW_NOTICE,
  WHAT_TO_DO,
  alertReason,
  alertTerms,
  classroomLabel,
  deliveryStatusLabel,
  isTestAlert,
  noWordsReason,
  pushStatusLabel,
  schoolLabel,
  storedTranscript,
  triggerTypeLabel,
  wordsHeard,
} from "@/lib/alert-presentation";
import { ApiError, getAlert } from "@/lib/api";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatTimestamp } from "@/lib/format";
import { useReviewAlert } from "@/lib/useReviewAlert";
import type { Alert } from "@/lib/types";
import type { ReviewOutcome } from "@/lib/review-outcome";

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

  const [asking, setAsking] = useState<"reviewed" | "resolved" | null>(null);

  const changeStatus = async (
    status: "active" | "reviewed" | "resolved",
    review: { outcome?: ReviewOutcome; note?: string } = {}
  ) => {
    if (!alert) return;
    const updated = await setStatus(alert, status, { undo: true, ...review });
    if (updated) {
      setAlert(updated);
      setAsking(null);
    }
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
  const transcript = storedTranscript(alert)?.trim();
  const language = alert.language && alert.language !== "unknown" ? alert.language : alertTerms(alert)[0]?.language;
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
        <section aria-labelledby="said-title">
          <h1 id="said-title" className="text-title font-semibold text-ink">
            What was said
          </h1>
          {transcript ? (
            <p className="mt-2 select-text whitespace-pre-wrap text-body-lg text-ink">
              <TranscriptQuote text={transcript} terms={words} />
            </p>
          ) : (
            <>
              <p className="mt-2 text-body-lg text-muted">Transcript not available</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {words.length > 0 ? (
                  words.map((word) => (
                    <span key={word} className="rounded-tag bg-surface px-2 py-1 text-body-lg font-semibold text-ink">
                      “{word}”
                    </span>
                  ))
                ) : (
                  <span className="text-body text-muted">{noWordsReason(alert)}</span>
                )}
              </div>
            </>
          )}
          {language && (
            <p className="mt-2 flex items-center gap-2 text-body text-muted">
              Language <LanguageBadge language={language} size="md" />
            </p>
          )}
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SeverityTag severity={alert.severity} />
          <p className="text-body-lg text-ink">{alertReason(alert)}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <ReviewState status={alert.status} outcome={alert.review_outcome} />
          {alert.outside_school_hours && <OutsideHoursTag />}
        </div>

        <p className="mt-3 text-body-lg text-ink">
          <span className="font-semibold">{classroomLabel(alert)}</span>
          <span className="num text-muted">
            {" · "}
            {formatTimestamp(alert.trigger_timestamp ?? alert.event_start_timestamp ?? alert.created_at)}
          </span>
        </p>

        <section aria-labelledby="todo-title" className="mt-4">
          <h2 id="todo-title" className="text-body-lg font-semibold text-ink">
            What to do
          </h2>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-body text-ink">
            {WHAT_TO_DO.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          {alert.status === "active" || alert.status === "unknown" ? (
            <>
              <Button variant="primary" icon={Check} pending={pending} onClick={() => setAsking("reviewed")}>
                Mark reviewed
              </Button>
              <Button icon={CheckCheck} disabled={pending} onClick={() => setAsking("resolved")}>
                Mark resolved
              </Button>
            </>
          ) : (
            <>
              {alert.status === "reviewed" && (
                <Button variant="primary" icon={CheckCheck} pending={pending} onClick={() => setAsking("resolved")}>
                  Mark resolved
                </Button>
              )}
              <Button icon={RotateCcw} disabled={pending} onClick={() => void changeStatus("active")}>
                Move back to Needs review
              </Button>
            </>
          )}
        </div>
        {alert.status !== "active" && alert.review_note && (
          <p className="mt-3 text-body text-ink">
            <span className="text-muted">Review note: </span>
            {alert.review_note}
          </p>
        )}
        {asking && (
          <ReviewOutcomeDialog
            action={asking}
            initialOutcome={alert.review_outcome}
            pending={pending}
            onCancel={() => setAsking(null)}
            onSubmit={(outcome, note) => void changeStatus(asking, { outcome, note })}
          />
        )}
        <div className="mt-4">
          <Note>{SHORT_REVIEW_NOTICE}</Note>
        </div>
      </header>

      {errorStatus !== null && (
        <p role="status" className="mt-4 text-body text-muted">
          The newest details couldn&apos;t be loaded. What you see came from the alert list a moment ago.
        </p>
      )}

      <details className="group mt-6 rounded-panel border border-line">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-body-lg font-medium text-ink sm:px-5">
          Technical details
          <span aria-hidden="true" className="text-muted group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-line px-4 py-4 sm:px-5">
          <AlertEvidence alert={alert} defaultExpanded hideToggle part="summary" hideTranscript />
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
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
