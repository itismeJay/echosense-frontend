"use client";

// The alert inbox: the one loud element in the product. A calm, dense, scannable list —
// severity word + stripe, classroom, words heard, time, and one-click review.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, FlaskConical } from "lucide-react";
import type { Alert } from "@/lib/types";
import {
  classroomLabel,
  isTestAlert,
  needsReview,
  noWordsReason,
  wordsHeard,
} from "@/lib/alert-presentation";
import { formatWhen } from "@/lib/format";
import { useReviewAlert } from "@/lib/useReviewAlert";
import { ReviewState, SeverityStripe, SeverityTag } from "@/components/ui/status";

interface AlertInboxProps {
  alerts: Alert[];
  /** "review" hides rows once reviewed; "all" keeps them and shows their status. */
  mode: "review" | "all";
  label: string;
  /** Shown as a quiet line under the device name in the row (super-admin/platform views). */
  showSchool?: boolean;
}

function AlertRow({
  alert,
  mode,
  isNew,
  leaving,
  onReview,
  onLeft,
  pending,
  showSchool,
}: {
  alert: Alert;
  mode: "review" | "all";
  isNew: boolean;
  leaving: boolean;
  onReview: () => void;
  onLeft: () => void;
  pending: boolean;
  showSchool: boolean;
}) {
  const words = wordsHeard(alert);
  const testAlert = isTestAlert(alert);
  const classroom = classroomLabel(alert);
  const device = alert.device_display_name?.trim() || alert.device_code?.trim();

  return (
    <li
      className={`group relative flex gap-3 border-b border-line px-3 py-3 last:border-b-0 hover:bg-surface sm:px-4 ${
        isNew ? "animate-row-in" : ""
      } ${leaving ? "animate-row-out" : ""}`}
      onAnimationEnd={leaving ? onLeft : undefined}
    >
      <SeverityStripe severity={alert.severity} />
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 md:grid-cols-[4.5rem_minmax(7rem,11rem)_1fr_8.5rem_auto]">
        <div className="col-span-2 flex items-center gap-2 md:col-span-1">
          <SeverityTag severity={alert.severity} />
          <span className="num text-small text-muted md:hidden">{formatWhen(alert.created_at)}</span>
        </div>

        <div className="min-w-0 md:order-none">
          <Link
            href={`/alerts/${alert.id}`}
            className="block truncate text-body-lg font-medium text-ink after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {classroom}
            <span className="sr-only">
              , {alert.severity} severity alert at {formatWhen(alert.created_at)}. Open details.
            </span>
          </Link>
          {(device || showSchool) && (
            <p className="truncate text-small text-muted">
              {showSchool && alert.school_name ? alert.school_name : device}
            </p>
          )}
        </div>

        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-1.5 md:col-span-1">
          {testAlert && (
            <span className="inline-flex items-center gap-1 rounded-tag border border-line-strong px-1.5 py-0.5 text-small font-medium text-ink">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              Test alert, not a real incident
            </span>
          )}
          {words.length > 0 ? (
            <>
              <span className="sr-only">Words heard:</span>
              {words.map((word) => (
                <span key={word} className="max-w-full truncate rounded-tag bg-surface px-1.5 py-0.5 text-body text-ink group-hover:bg-bg">
                  “{word}”
                </span>
              ))}
            </>
          ) : (
            <span className="text-body text-muted">{noWordsReason(alert)}</span>
          )}
        </div>

        <span className="num hidden text-right text-body text-muted md:block">{formatWhen(alert.created_at)}</span>

        <div className="relative z-10 col-start-2 row-start-2 flex justify-end md:col-start-auto md:row-start-auto">
          {needsReview(alert) ? (
            <button
              type="button"
              onClick={onReview}
              disabled={pending || leaving}
              aria-label={`Mark reviewed: ${classroom}, ${formatWhen(alert.created_at)}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line-strong bg-bg px-3 text-small font-medium text-ink hover:border-ink disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {pending ? "Saving…" : "Mark reviewed"}
            </button>
          ) : mode === "all" ? (
            <ReviewState status={alert.status} />
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function AlertInbox({ alerts, mode, label, showSchool = false }: AlertInboxProps) {
  const { setStatus, pendingId } = useReviewAlert();
  const [leaving, setLeaving] = useState<Set<number>>(new Set());
  // Rows that arrive after the list first renders get a brief highlight.
  const seenRef = useRef<Set<number> | null>(null);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const ids = alerts.map((alert) => alert.id);
    if (seenRef.current === null) {
      seenRef.current = new Set(ids);
      return;
    }
    const arrived = ids.filter((id) => !seenRef.current?.has(id));
    if (arrived.length === 0) return;
    arrived.forEach((id) => seenRef.current?.add(id));
    const timer = setTimeout(() => setNewIds(new Set(arrived)), 0);
    return () => clearTimeout(timer);
  }, [alerts]);

  const review = async (alert: Alert) => {
    if (mode === "review") setLeaving((current) => new Set(current).add(alert.id));
    const updated = await setStatus(alert, "reviewed");
    if (!updated) {
      setLeaving((current) => {
        const next = new Set(current);
        next.delete(alert.id);
        return next;
      });
    }
  };

  const visible = mode === "review" ? alerts.filter((alert) => needsReview(alert) || leaving.has(alert.id)) : alerts;

  return (
    <ul aria-label={label} className="rounded-panel border border-line bg-bg">
      {visible.map((alert) => (
        <AlertRow
          key={alert.id}
          alert={alert}
          mode={mode}
          isNew={newIds.has(alert.id) && !leaving.has(alert.id)}
          leaving={leaving.has(alert.id) && !needsReview(alert)}
          pending={pendingId === alert.id}
          onReview={() => void review(alert)}
          onLeft={() =>
            setLeaving((current) => {
              const next = new Set(current);
              next.delete(alert.id);
              return next;
            })
          }
          showSchool={showSchool}
        />
      ))}
    </ul>
  );
}
