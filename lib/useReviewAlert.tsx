"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { reviewAlert } from "./api";
import { useAlerts } from "./AlertsProvider";
import type { Alert } from "./types";

type ReviewStatus = "active" | "reviewed" | "resolved";

const DONE_MESSAGE: Record<ReviewStatus, string> = {
  reviewed: "Marked reviewed",
  resolved: "Marked resolved",
  active: "Moved back to Needs review",
};

/** One-click review with an Undo in the confirmation toast. */
export function useReviewAlert() {
  const { updateAlert } = useAlerts();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const setStatus = useCallback(
    async (alert: Alert, status: ReviewStatus, options: { undo?: boolean } = { undo: true }) => {
      const previous = alert.status === "unknown" ? "active" : alert.status;
      setPendingId(alert.id);
      try {
        const updated = await reviewAlert(alert.id, status);
        updateAlert(updated);
        toast.custom(
          (shown) => (
            <div
              role="status"
              className="flex items-center gap-3 rounded-control border border-line bg-bg px-4 py-3 text-body text-ink shadow-pop"
            >
              <span>{DONE_MESSAGE[status]}</span>
              {options.undo && previous !== status && (
                <button
                  type="button"
                  className="min-h-9 rounded-control px-2 font-medium text-link underline underline-offset-2"
                  onClick={() => {
                    toast.dismiss(shown.id);
                    void reviewAlert(alert.id, previous)
                      .then(updateAlert)
                      .catch(() => toast.error("Couldn't undo. Open the alert to change it."));
                  }}
                >
                  Undo
                </button>
              )}
            </div>
          ),
          { duration: 6000 }
        );
        return updated;
      } catch (error) {
        toast.error(
          error instanceof Error ? `${error.message} The alert was not changed.` : "The alert was not changed. Try again."
        );
        return null;
      } finally {
        setPendingId(null);
      }
    },
    [updateAlert]
  );

  return { setStatus, pendingId };
}
