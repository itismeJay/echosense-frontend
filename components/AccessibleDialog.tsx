"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface AccessibleDialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  closeDisabled?: boolean;
  size?: "default" | "large";
  children: React.ReactNode;
}

export default function AccessibleDialog({
  title,
  description,
  onClose,
  closeDisabled = false,
  size = "default",
  children,
}: AccessibleDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled, onClose]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabledRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`animate-pop-in relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-panel border border-line bg-bg p-5 shadow-pop sm:p-6 ${
          size === "large" ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="pr-10">
          <h2 id={titleId} className="text-title font-semibold text-ink">
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="mt-1.5 text-body text-muted"
            >
              {description}
            </p>
          )}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
