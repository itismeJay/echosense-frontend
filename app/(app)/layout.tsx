"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AlertsProvider from "@/lib/AlertsProvider";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import NoAccess from "@/components/NoAccess";
import { ErrorState, Page, Skeleton } from "@/components/ui";
import { accessRoleOf, canAccessPath, isSchoolPage } from "@/lib/access";
import { useCurrentUserState } from "@/lib/auth";
import { useSchoolScope } from "@/lib/school-scope";
import { CHANGE_PASSWORD_PATH } from "@/lib/session-errors";

// Client page guard: same table as proxy.ts and the Sidebar, but with the /auth/me user,
// so it can tell super admins from school admins and sees must_change_password.
function PageGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useCurrentUserState();
  const scope = useSchoolScope();
  const pathname = usePathname();
  const router = useRouter();
  const mustChangePassword = user?.must_change_password === true;
  const role = accessRoleOf(user);
  // A super admin outside any school picks one on All schools first.
  const needsSchool = role === "super_admin" && !scope && isSchoolPage(pathname);

  useEffect(() => {
    if (mustChangePassword) router.replace(CHANGE_PASSWORD_PATH);
    else if (needsSchool) router.replace("/schools");
  }, [mustChangePassword, needsSchool, router]);

  if (status === "error") {
    return (
      <Page>
        <ErrorState
          title="EchoSense couldn't confirm your account"
          onRetry={() => window.location.reload()}
        >
          Check the internet connection, then select Try again. If it keeps happening, sign out and sign in again.
        </ErrorState>
      </Page>
    );
  }
  if (!user || mustChangePassword || needsSchool) {
    return (
      <Page>
        <div role="status">
          <span className="sr-only">Loading your account</span>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-6 h-48" />
        </div>
      </Page>
    );
  }
  if (!canAccessPath(role, pathname)) return <NoAccess />;
  return <>{children}</>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-bg">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuOpen={() => setMobileOpen(true)} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
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
