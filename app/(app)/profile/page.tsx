"use client";

import toast from "react-hot-toast";
import { KeyRound, Mail, Palette, ShieldCheck, UserRound } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import NotificationSettings from "@/components/NotificationSettings";
import ThemeToggle from "@/components/ThemeToggle";
import { isSuperAdmin } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";

const ROLE_LABELS = {
  admin: "Administrator",
  staff: "Teacher / Staff",
  counselor: "Guidance Counselor",
} as const;

export default function ProfilePage() {
  const user = useCurrentUser();

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          Your account
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          Profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          View the account and access level used for this session.
        </p>
      </header>

      <section
        aria-labelledby="account-information-title"
        className="rounded-panel border border-line bg-bg p-5 sm:p-6"
      >
        <h2
          id="account-information-title"
          className="text-lg font-semibold text-ink"
        >
          Account information
        </h2>

        {!user ? (
          <div role="status" className="mt-5 space-y-3">
            <span className="sr-only">Loading account information</span>
            <div className="h-16 animate-pulse rounded-control bg-surface" />
            <div className="h-16 animate-pulse rounded-control bg-surface" />
          </div>
        ) : (
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-control bg-surface p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted">
                  Email
                </dt>
                <dd className="mt-1 break-words font-medium text-ink">
                  {user.email}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-control bg-surface p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-muted">
                  Access level
                </dt>
                <dd className="mt-1 font-medium text-ink">
                  {isSuperAdmin(user) ? "Super Administrator" : ROLE_LABELS[user.role]}
                </dd>
              </div>
            </div>
          </dl>
        )}
      </section>

      <section
        aria-labelledby="change-password-title"
        className="mt-5 rounded-panel border border-line bg-bg p-5 sm:p-6"
      >
        <div className="mb-5 flex gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
          <div>
            <h2 id="change-password-title" className="font-semibold text-ink">
              Change password
            </h2>
            <p className="mt-1 text-sm text-muted">
              Enter your current password, then choose a new one.
            </p>
          </div>
        </div>
        <ChangePasswordForm onChanged={() => void toast.success("Password changed.")} />
      </section>

      <div className="mt-5">
        <NotificationSettings />
      </div>

      <section
        aria-labelledby="appearance-title"
        className="mt-5 rounded-panel border border-line bg-bg p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <Palette className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden="true" />
            <div>
              <h2 id="appearance-title" className="font-semibold text-ink">
                Appearance
              </h2>
              <p className="mt-1 text-sm text-muted">
                Switch between light and dark display modes.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <p className="mt-5 flex gap-2 text-sm leading-6 text-muted">
        <UserRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Email address and access level are managed by an administrator.
      </p>
    </div>
  );
}
