"use client";

import { useRef, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import AccessibleDialog from "@/components/AccessibleDialog";
import { Button } from "@/components/ui";
import type { PasswordResetResult } from "@/lib/types";

/** Shows a reset's temporary password once, for the admin to give to the person. */
export default function TemporaryPasswordDialog({
  result,
  onClose,
}: {
  result: PasswordResetResult;
  onClose: () => void;
}) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.temporary_password);
      setCopied(true);
      toast.success("Password copied");
    } catch {
      passwordRef.current?.focus();
      passwordRef.current?.select();
      toast.error("Copy failed. The password is selected so you can copy it yourself.");
    }
  };

  return (
    <AccessibleDialog
      title="Password reset. Give them this password"
      description={`${result.user.email} signs in with it once, then chooses their own.`}
      onClose={onClose}
    >
      <div className="flex gap-3 rounded-control border border-sev-medium/40 bg-sev-medium-bg p-4 text-ink">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-sev-medium" aria-hidden="true" />
        <p className="text-body">
          It is shown only this once. Their old password no longer works. If you lose this one, reset the password
          again.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="temporary-password" className="mb-1.5 block text-body font-medium text-ink">
          Temporary password
        </label>
        <input
          ref={passwordRef}
          id="temporary-password"
          readOnly
          value={result.temporary_password}
          onFocus={(event) => event.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
          className="num min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 font-mono text-body-lg text-ink"
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button icon={copied ? Check : Copy} onClick={() => void copy()}>
          {copied ? "Copied" : "Copy password"}
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </AccessibleDialog>
  );
}
