"use client";

import AccessibleDialog from "@/components/AccessibleDialog";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
  tone?: "danger" | "primary";
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  pending = false,
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <AccessibleDialog
      title={title}
      description={description}
      onClose={onCancel}
      closeDisabled={pending}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
            tone === "danger"
              ? "bg-red-700 hover:bg-red-800"
              : "bg-indigo-700 hover:bg-indigo-800"
          }`}
        >
          {pending ? "Working…" : confirmLabel}
        </button>
      </div>
    </AccessibleDialog>
  );
}
