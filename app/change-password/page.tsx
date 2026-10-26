"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { KeyRound, LogOut } from "lucide-react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import ThemeToggle from "@/components/ThemeToggle";
import { logout, refreshCurrentUser, useCurrentUser } from "@/lib/auth";
import { accessRoleOf, homePathFor } from "@/lib/access";

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
    router.replace(homePathFor(accessRoleOf(refreshed)));
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex min-h-11 items-center justify-center rounded-control bg-surface px-3 text-link">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {forced ? "Set a new password" : "Change password"}
          </h1>
          <p className="text-sm text-muted">
            {forced
              ? "Your account was created with a temporary password. Choose a new one to continue."
              : "Choose a new password for your account."}
          </p>
          {user && (
            <p className="text-sm font-medium text-ink">
              {user.email}
            </p>
          )}
        </div>

        <div className="rounded-control border border-line bg-bg p-6">
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
              href="/overview"
              className="inline-flex min-h-11 items-center font-medium text-link hover:underline"
            >
              Back to Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 font-medium text-muted hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
