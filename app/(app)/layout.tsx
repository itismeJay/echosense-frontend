"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import AlertsProvider from "@/lib/AlertsProvider";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import NoAccess from "@/components/NoAccess";
import { accessRoleOf, canAccessPath } from "@/lib/access";
import { useCurrentUserState } from "@/lib/auth";
import { CHANGE_PASSWORD_PATH } from "@/lib/session-errors";

// Client page guard: same table as proxy.ts and the Sidebar, but with the /auth/me user,
// so it can tell super admins from school admins and sees must_change_password.
function PageGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useCurrentUserState();
  const pathname = usePathname();
  const router = useRouter();
  const mustChangePassword = user?.must_change_password === true;

  useEffect(() => {
    if (mustChangePassword) router.replace(CHANGE_PASSWORD_PATH);
  }, [mustChangePassword, router]);

  if (status === "error") {
    return (
      <div role="alert" className="mx-auto max-w-xl p-4 md:p-6 lg:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30">
          <h1 className="font-bold text-red-950 dark:text-red-100">
            We couldn&apos;t confirm your account.
          </h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            Please check the connection and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!user || mustChangePassword) {
    return (
      <div role="status" className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
        <span className="sr-only">Loading your account</span>
        <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }
  if (!canAccessPath(accessRoleOf(user), pathname)) return <NoAccess />;
  return <>{children}</>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      <Navbar
        mobileMenuOpen={mobileOpen}
        onMenuOpen={() => setMobileOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto"
        >
          <PageGuard>{children}</PageGuard>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AlertsProvider>
      <AppShell>{children}</AppShell>
    </AlertsProvider>
  );
}
