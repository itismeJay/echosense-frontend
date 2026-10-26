"use client";

import { FormEvent, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { ApiError, changePassword } from "@/lib/api";
import { PASSWORD_MIN_LENGTH, newPasswordProblem } from "@/lib/password-policy";

const INPUT =
  "min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 pr-12 text-sm text-ink       ";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete: string;
  describedBy?: string;
  onChange: (value: string) => void;
}

function PasswordField({
  id,
  label,
  value,
  visible,
  autoComplete,
  describedBy,
  onChange,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT}
      />
    </div>
  );
}

interface ChangePasswordFormProps {
  submitLabel?: string;
  onChanged: () => void | Promise<void>;
}

export default function ChangePasswordForm({
  submitLabel = "Change password",
  onChanged,
}: ChangePasswordFormProps) {
  const id = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = newPasswordProblem({ currentPassword, newPassword, confirmPassword });
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError("The current password is incorrect.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError(err.message);
      } else {
        setError("We couldn’t change the password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
      <PasswordField
        id={`${id}-current`}
        label="Current password"
        value={currentPassword}
        visible={visible}
        autoComplete="current-password"
        onChange={setCurrentPassword}
      />
      <PasswordField
        id={`${id}-new`}
        label="New password"
        value={newPassword}
        visible={visible}
        autoComplete="new-password"
        describedBy={hintId}
        onChange={setNewPassword}
      />
      <p id={hintId} className="-mt-2 text-xs text-muted">
        At least {PASSWORD_MIN_LENGTH} characters, different from the current password.
      </p>
      <PasswordField
        id={`${id}-confirm`}
        label="Confirm new password"
        value={confirmPassword}
        visible={visible}
        autoComplete="new-password"
        onChange={setConfirmPassword}
      />

      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
        className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-medium text-muted hover:text-ink"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
        {visible ? "Hide passwords" : "Show passwords"}
      </button>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-2 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        )}
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
