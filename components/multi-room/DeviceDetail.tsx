"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import AlertCard from "@/components/AlertCard";
import { ApiError, getAlerts, getDevice } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { Alert, EdgeDevice } from "@/lib/types";
import ResourceError from "./ResourceError";
import StatusBadge from "./StatusBadge";

function timestamp(value: string | null, fallback: string) {
  return value ? formatTimestamp(value) : fallback;
}

export default function DeviceDetail({ deviceId }: { deviceId: string }) {
  const [device, setDevice] = useState<EdgeDevice | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextDevice, nextAlerts] = await Promise.all([
        getDevice(deviceId),
        getAlerts({ device_id: deviceId, limit: 4 }),
      ]);
      setDevice(nextDevice);
      setAlerts(nextAlerts);
      setError(null);
      setErrorStatus(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Device details are unavailable.");
      setErrorStatus(caught instanceof ApiError ? caught.status : null);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <Link href="/devices" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-link hover:text-link">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to devices
      </Link>

      {error && !device && <ResourceError title={errorStatus === 404 ? "Device not found." : "We couldn’t load this device."} message={error} status={errorStatus} onRetry={() => void load()} />}
      {loading && !device ? <div aria-label="Loading device details" className="h-96 animate-pulse rounded-panel bg-surface" /> : device ? <>
        <header className="rounded-panel border border-line bg-bg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs text-muted">{device.device_code}</p><h1 className="mt-1 text-2xl font-semibold text-ink">{device.display_name}</h1></div><div className="flex flex-wrap gap-2"><StatusBadge active={device.is_active} inactiveLabel="Disabled" /><span className="inline-flex rounded-full border border-line-strong px-2.5 py-1 text-xs font-semibold text-ink">{device.assignment_state}</span></div></div>
          <dl className="mt-6 grid gap-5 border-t border-line pt-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="font-medium text-muted">School</dt><dd className="mt-1 text-ink">{device.school_name ?? "School unavailable"}</dd></div>
            <div><dt className="font-medium text-muted">Classroom</dt><dd className="mt-1 text-ink">{device.classroom_name ?? "Unassigned"}</dd></div>
            <div><dt className="font-medium text-muted">Last seen</dt><dd className="mt-1 text-ink">{timestamp(device.last_seen_at, "Never")}</dd></div>
            <div><dt className="font-medium text-muted">Assigned at</dt><dd className="mt-1 text-ink">{timestamp(device.assigned_at, "Not assigned")}</dd></div>
            <div><dt className="font-medium text-muted">Key rotated at</dt><dd className="mt-1 text-ink">{timestamp(device.key_rotated_at, "Never rotated")}</dd></div>
            <div><dt className="font-medium text-muted">Created at</dt><dd className="mt-1 text-ink">{formatTimestamp(device.created_at)}</dd></div>
            <div><dt className="font-medium text-muted">Updated at</dt><dd className="mt-1 text-ink">{formatTimestamp(device.updated_at)}</dd></div>
          </dl>
          <p className="mt-6 border-t border-line pt-5 text-sm text-muted">Device secrets are never available from this detail view. Return to the device list to manage assignment, status, metadata, or key rotation.</p>
          <Link href="/devices" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover">Manage this device</Link>
        </header>

        <section className="mt-8" aria-labelledby="device-alerts-title"><div className="mb-4 flex items-center justify-between gap-3"><h2 id="device-alerts-title" className="text-xl font-semibold text-ink">Recent alerts from this device</h2><Link href={`/alerts?device_id=${encodeURIComponent(device.id)}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link"><BellRing className="h-4 w-4" aria-hidden="true" /> View filtered alerts</Link></div>{alerts.length === 0 ? <div className="rounded-panel border border-dashed border-line-strong bg-bg px-6 py-10 text-center text-sm text-muted">No alerts have been recorded for this device.</div> : <div className="grid gap-4 md:grid-cols-2">{alerts.map((alert) => <AlertCard key={alert.id} alert={alert} compact />)}</div>}</section>
      </> : null}
    </div>
  );
}
