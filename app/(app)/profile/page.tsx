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
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Your account
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
          Profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          View the account and access level used for this session.
        </p>
      </header>

      <section
        aria-labelledby="account-information-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2
          id="account-information-title"
          className="text-lg font-bold text-slate-950 dark:text-white"
        >
          Account information
        </h2>

        {!user ? (
          <div role="status" className="mt-5 space-y-3">
            <span className="sr-only">Loading account information</span>
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : (
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Email
                </dt>
                <dd className="mt-1 break-words font-medium text-slate-950 dark:text-white">
                  {user.email}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Access level
                </dt>
                <dd className="mt-1 font-medium text-slate-950 dark:text-white">
                  {isSuperAdmin(user) ? "Super Administrator" : ROLE_LABELS[user.role]}
                </dd>
              </div>
            </div>
          </dl>
        )}
      </section>

      <section
        aria-labelledby="change-password-title"
        className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-5 flex gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          <div>
            <h2 id="change-password-title" className="font-bold text-slate-950 dark:text-white">
              Change password
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
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
        className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <Palette className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <div>
              <h2 id="appearance-title" className="font-bold text-slate-950 dark:text-white">
                Appearance
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Switch between light and dark display modes.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <p className="mt-5 flex gap-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        <UserRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Email address and access level are managed by an administrator.
      </p>
    </div>
  );
}
