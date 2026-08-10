"use client";

import { RefreshCw } from "lucide-react";

interface ResourceErrorProps {
  title: string;
  message: string;
  status?: number | null;
  onRetry?: () => void;
}

export default function ResourceError({
  title,
  message,
  status,
  onRetry,
}: ResourceErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30"
    >
      <p className="font-semibold text-red-950 dark:text-red-100">
        {status === 403 ? "You do not have permission." : title}
      </p>
      <p className="mt-1 text-sm text-red-800 dark:text-red-200">
        {status === 403
          ? "This management area is available to authorized administrators."
          : message}
      </p>
      {onRetry && status !== 403 && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
