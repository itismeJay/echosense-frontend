"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Info, MapPinned } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export default function HeatmapPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Administrator
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
          Classroom Area Map
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Classroom zone information will appear here when supported by verified
          classroom location data.
        </p>
      </header>

      <section
        aria-labelledby="map-unavailable-title"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <span className="inline-flex rounded-2xl bg-slate-100 p-4 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <MapPinned className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2
          id="map-unavailable-title"
          className="mt-5 text-xl font-bold text-slate-950 dark:text-white"
        >
          Classroom area data is not available
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The frontend does not currently receive classroom zone coordinates or
          per-zone alert intensity from the monitoring system. A map cannot be shown
          accurately without that information.
        </p>

        <div className="mt-6 flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-indigo-950 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-100">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            The previous static demonstration has been removed so administrators
            are not shown invented classroom activity.
          </p>
        </div>
      </section>
    </div>
  );
}
