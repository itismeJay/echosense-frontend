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
      toast.success("Key copied");
    } catch {
      keyRef.current?.focus();
      keyRef.current?.select();
      toast.error("Copy failed. The key is selected for manual copying.");
    }
  };

  return (
    <AccessibleDialog
      title={operation === "registered" ? "Device added. Save its key now" : "New key created. Save it now"}
      description="Enter this key on the classroom device. It is shown only once."
      onClose={onClose}
    >
      <div className="flex gap-3 rounded-control border border-sev-medium/40 bg-sev-medium-bg p-4 text-ink">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-sev-medium" aria-hidden="true" />
        <p className="text-body">
          Copy the key before you close this window. After that, EchoSense can&apos;t show it again, and you would
          need to create a new one.
        </p>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-muted">Device name</dt>
          <dd className="mt-1 font-semibold text-ink">
            {result.device.display_name}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted">Device code</dt>
          <dd className="mt-1 font-mono text-ink">
            {result.device.device_code}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <label htmlFor="one-time-device-key" className="mb-1.5 block text-sm font-semibold text-ink">
          Device key
        </label>
        <input
          ref={keyRef}
          id="one-time-device-key"
          readOnly
          value={result.device_key}
          onFocus={(event) => event.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
          className="min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-sm text-ink"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void copyKey()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control border border-line-strong bg-bg px-4 py-2 text-body font-medium text-ink hover:bg-surface"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy key"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 flex-1 rounded-control bg-brand px-4 py-2 text-body font-medium text-brand-ink hover:bg-brand-hover"
        >
          I have saved it
        </button>
      </div>
    </AccessibleDialog>
  );
}
