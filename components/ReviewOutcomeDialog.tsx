"use client";

import { useId, useState } from "react";
import AccessibleDialog from "@/components/AccessibleDialog";
import { Button, Field, inputClass } from "@/components/ui";
import { REVIEW_NOTE_MAX, REVIEW_OUTCOMES, type ReviewOutcome } from "@/lib/review-outcome";

/** Asks what the reviewer concluded before an alert is marked reviewed or resolved. */
export default function ReviewOutcomeDialog({
  action,
  initialOutcome,
  pending,
  onCancel,
  onSubmit,
}: {
  action: "reviewed" | "resolved";
  initialOutcome?: ReviewOutcome | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (outcome: ReviewOutcome, note: string) => void;
}) {
  const [outcome, setOutcome] = useState<ReviewOutcome | null>(initialOutcome ?? null);
  const [note, setNote] = useState("");
  const noteId = useId();
  const verb = action === "reviewed" ? "Mark reviewed" : "Mark resolved";

  return (
    <AccessibleDialog title="What happened?" description="Choose the outcome. It is saved with the alert." onClose={onCancel} closeDisabled={pending}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (outcome) onSubmit(outcome, note);
        }}
      >
        <fieldset>
          <legend className="sr-only">Outcome</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {REVIEW_OUTCOMES.map((item) => (
              <label
                key={item.value}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-body text-ink ${
                  outcome === item.value ? "border-ink" : "border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="review-outcome"
                  value={item.value}
                  checked={outcome === item.value}
                  onChange={() => setOutcome(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id={noteId} label="Note (optional)" className="mt-4">
          <textarea
            id={noteId}
            rows={3}
            maxLength={REVIEW_NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={`${inputClass} h-auto py-2`}
          />
        </Field>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" pending={pending} disabled={!outcome}>
            {verb}
          </Button>
        </div>
        {!outcome && <p className="mt-2 text-right text-small text-muted">Choose an outcome to continue.</p>}
      </form>
    </AccessibleDialog>
  );
}
