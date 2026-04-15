"use client";

import { useState } from "react";
import AlertsProvider, { useAlerts } from "@/lib/AlertsProvider";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

function AppShell({ children }: { children: React.ReactNode }) {
  const { flashKey } = useAlerts();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Ambient mesh gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/[0.06] dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.06] dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-cyan-500/[0.04] dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2000ms]" />
      </div>

      {/*
        Flash overlay — uses `key` to remount the element each time flashKey increments,
        which re-triggers the CSS animation without any setState-in-effect pattern.
      */}
      <div
        key={flashKey}
        className="absolute inset-0 pointer-events-none alert-flashing z-50"
        aria-hidden="true"
      />

      <Navbar onMenuOpen={() => setMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
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
