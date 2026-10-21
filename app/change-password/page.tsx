"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { KeyRound, LogOut } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import ThemeToggle from "@/components/ThemeToggle";
import { logout, refreshCurrentUser, useCurrentUser } from "@/lib/auth";

// Outside the (app) group on purpose: while must_change_password is set the backend
// rejects every data route, so this page must not mount the alert polling shell.
export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const forced = user?.must_change_password !== false;

  const handleChanged = async () => {
    const refreshed = await refreshCurrentUser();
    if (refreshed?.must_change_password) {
      toast.error("Your account still requires a password change. Please try again.");
      return;
    }
    toast.success("Password changed.");
    router.replace("/dashboard");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex min-h-11 items-center justify-center rounded-xl bg-indigo-100 px-3 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {forced ? "Set a new password" : "Change password"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {forced
              ? "Your account was created with a temporary password. Choose a new one to continue."
              : "Choose a new password for your account."}
          </p>
          {user && (
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {user.email}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <ChangePasswordForm
            submitLabel={forced ? "Save and continue" : "Change password"}
            onChanged={handleChanged}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          {forced ? (
            <span />
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center font-medium text-indigo-700 hover:underline dark:text-indigo-300"
            >
              Back to Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-medium text-zinc-600 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-zinc-300 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
