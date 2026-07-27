"use client";

import { useState } from "react";
import AlertsProvider from "@/lib/AlertsProvider";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

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
          {children}
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
