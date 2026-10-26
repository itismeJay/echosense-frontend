"use client";

import AccessibleDialog from "@/components/AccessibleDialog";
import { Button } from "@/components/ui";

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
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          pending={pending}
        >
          {pending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </AccessibleDialog>
  );
}
