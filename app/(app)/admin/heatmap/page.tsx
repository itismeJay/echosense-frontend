"use client";

import { Info, MapPinned } from "lucide-react";

export default function HeatmapPage() {


  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          Administrator
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">
          Classroom Area Map
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Classroom zone information will appear here when supported by verified
          classroom location data.
        </p>
      </header>

      <section
        aria-labelledby="map-unavailable-title"
        className="rounded-panel border border-line bg-bg p-6 sm:p-8"
      >
        <span className="inline-flex rounded-panel bg-surface p-4 text-ink">
          <MapPinned className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2
          id="map-unavailable-title"
          className="mt-5 text-xl font-semibold text-ink"
        >
          Classroom area data is not available
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          The frontend does not currently receive classroom zone coordinates or
          per-zone alert intensity from the monitoring system. A map cannot be shown
          accurately without that information.
        </p>

        <div className="mt-6 flex gap-3 rounded-control border border-line bg-surface p-4 text-sm leading-6 text-link">
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
