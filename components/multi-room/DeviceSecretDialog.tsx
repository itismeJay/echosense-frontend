"use client";

import { useRef, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import AccessibleDialog from "@/components/AccessibleDialog";
import type { DeviceRegistrationResult } from "@/lib/types";

interface DeviceSecretDialogProps {
  result: DeviceRegistrationResult;
  operation: "registered" | "rotated";
  onClose: () => void;
}

export default function DeviceSecretDialog({
  result,
  operation,
  onClose,
}: DeviceSecretDialogProps) {
  const keyRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(result.device_key);
      setCopied(true);
      toast.success("Device key copied.");
    } catch {
      keyRef.current?.focus();
      keyRef.current?.select();
      toast.error("Copy failed. The key is selected for manual copying.");
    }
  };

  return (
    <AccessibleDialog
      title={`Device ${operation} successfully.`}
      description="Save this device key now. It will not be shown again."
      onClose={onClose}
    >
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-6">
            Store this credential securely before closing this dialog. Closing it
            permanently removes the plaintext key from this page.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Device name</dt>
          <dd className="mt-1 font-semibold text-slate-950 dark:text-white">
            {result.device.display_name}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Device code</dt>
          <dd className="mt-1 font-mono text-slate-950 dark:text-white">
            {result.device.device_code}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <label htmlFor="one-time-device-key" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">
          One-time device key
        </label>
        <input
          ref={keyRef}
          id="one-time-device-key"
          readOnly
          value={result.device_key}
          onFocus={(event) => event.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 font-mono text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void copyKey()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-950 dark:text-indigo-200 dark:hover:bg-indigo-950/30"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy key"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 flex-1 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
        >
          I have saved it
        </button>
      </div>
    </AccessibleDialog>
  );
}
