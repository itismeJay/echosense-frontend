"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import ChangePasswordForm from "@/components/ChangePasswordForm";
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
      toast.error("Your account still needs a new password. Try again.");
      return;
    }
    toast.success("Password changed");
    router.replace(homePathFor(accessRoleOf(refreshed)));
  };

  return (
    <AuthShell
      title={forced ? "Choose your own password" : "Change password"}
      description={
        <>
          {forced
            ? "You signed in with a temporary password. Choose a new one to continue."
            : "Enter your current password, then choose a new one."}
          {user && <span className="mt-1 block text-body text-ink">{user.email}</span>}
        </>
      }
      footer={
        <div className="flex items-center justify-between gap-4 text-body">
          {forced ? (
            <span />
          ) : (
            <Link href={homePathFor(accessRoleOf(user))} className="inline-flex min-h-11 items-center font-medium text-link underline-offset-4 hover:underline">
              Back to EchoSense
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
      }
    >
      <ChangePasswordForm submitLabel={forced ? "Save and continue" : "Change password"} onChanged={handleChanged} />
    </AuthShell>
  );
}
