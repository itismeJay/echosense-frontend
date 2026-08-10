"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, Cpu } from "lucide-react";
import AlertCard from "@/components/AlertCard";
import { ApiError, getAlerts, getClassroom } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { Alert, Classroom } from "@/lib/types";
import ResourceError from "./ResourceError";
import StatusBadge from "./StatusBadge";

export default function ClassroomDetail({ classroomId }: { classroomId: string }) {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextClassroom, nextAlerts] = await Promise.all([
        getClassroom(classroomId),
        getAlerts({ classroom_id: classroomId, limit: 4 }),
      ]);
      setClassroom(nextClassroom);
      setAlerts(nextAlerts);
      setError(null);
      setErrorStatus(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Classroom details are unavailable.");
      setErrorStatus(caught instanceof ApiError ? caught.status : null);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <Link href="/classrooms" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to classrooms
      </Link>

      {error && !classroom && (
        <ResourceError
          title={errorStatus === 404 ? "Classroom not found." : "We couldn’t load this classroom."}
          message={error}
          status={errorStatus}
          onRetry={() => void load()}
        />
      )}

      {loading && !classroom ? (
        <div aria-label="Loading classroom details" className="space-y-5">
          <div className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : classroom ? (
        <>
          <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{classroom.school_name}</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{classroom.name}</h1>
              </div>
              <StatusBadge active={classroom.is_active} />
            </div>
            <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2 dark:border-slate-800">
              <div><dt className="font-medium text-slate-500 dark:text-slate-400">Created</dt><dd className="mt-1 text-slate-900 dark:text-white">{formatTimestamp(classroom.created_at)}</dd></div>
              <div><dt className="font-medium text-slate-500 dark:text-slate-400">Last updated</dt><dd className="mt-1 text-slate-900 dark:text-white">{formatTimestamp(classroom.updated_at)}</dd></div>
            </dl>
          </header>

          <section className="mt-6" aria-labelledby="assigned-devices-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="assigned-devices-title" className="text-xl font-bold text-slate-950 dark:text-white">Assigned devices</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{classroom.devices.length}</span>
            </div>
            {classroom.devices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
                <Cpu className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">No device assigned</p>
                <Link href="/devices" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">Manage devices</Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {classroom.devices.map((device) => (
                  <Link key={device.id} href={`/devices/${device.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800">
                    <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950 dark:text-white">{device.display_name}</h3><p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{device.device_code}</p></div><StatusBadge active={device.is_active} activeLabel="Active" inactiveLabel="Disabled" /></div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8" aria-labelledby="classroom-alerts-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="classroom-alerts-title" className="text-xl font-bold text-slate-950 dark:text-white">Recent alerts</h2>
              <Link href={`/alerts?classroom_id=${encodeURIComponent(classroom.id)}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300"><BellRing className="h-4 w-4" aria-hidden="true" /> View filtered alerts</Link>
            </div>
            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No alerts have been recorded for this classroom.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">{alerts.map((alert) => <AlertCard key={alert.id} alert={alert} compact />)}</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
