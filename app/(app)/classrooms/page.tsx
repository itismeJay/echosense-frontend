"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronRight, Cpu, DoorOpen, MapPinned, Plus } from "lucide-react";
import { ClassroomNameDialog, MoveDeviceDialog } from "@/components/classrooms/dialogs";
import { Button, EmptyState, ErrorState, LoadingRows, Page, PageHeader } from "@/components/ui";
import { DeviceStatus } from "@/components/ui/status";
import { useAlerts } from "@/lib/AlertsProvider";
import { ApiError, assignDevice, createClassroom } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { useSchoolScope } from "@/lib/school-scope";
import { useClassroomData } from "@/lib/useClassroomData";
import type { EdgeDevice } from "@/lib/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function ClassroomsPage() {
  const user = useCurrentUser();
  const scope = useSchoolScope();
  const schoolId = user?.school_id ?? scope?.id ?? null;
  const { classrooms, devices, statuses, error, reload } = useClassroomData();
  const { alerts } = useAlerts();
  const [adding, setAdding] = useState(false);
  const [placing, setPlacing] = useState<EdgeDevice | null>(null);
  const [pending, setPending] = useState(false);
  const [weekAgo] = useState(() => Date.now() - WEEK_MS);

  const weekCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of alerts) {
      if (!alert.classroom_id || new Date(alert.created_at).getTime() < weekAgo) continue;
      counts.set(alert.classroom_id, (counts.get(alert.classroom_id) ?? 0) + 1);
    }
    return counts;
  }, [alerts, weekAgo]);

  const unplaced = devices.filter((device) => !device.classroom_id);
  const sorted = [...(classrooms ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name));

  const addClassroom = async (name: string) => {
    if (!schoolId) {
      toast.error("Open a school first, then add the classroom.");
      return;
    }
    setPending(true);
    try {
      await createClassroom({ school_id: schoolId, name });
      setAdding(false);
      toast.success(`${name} added`);
      await reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "The classroom was not added. Try again.");
    } finally {
      setPending(false);
    }
  };

  const placeDevice = async (classroomId: string) => {
    if (!placing) return;
    setPending(true);
    try {
      await assignDevice(placing.id, { classroom_id: classroomId });
      setPlacing(null);
      toast.success("Device moved");
      await reload();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError && caught.status === 409
          ? "This device was just changed by someone else. The list has been refreshed."
          : caught instanceof Error
            ? caught.message
            : "The device was not moved."
      );
      await reload();
    } finally {
      setPending(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Classrooms"
        description="Each classroom's device, whether it's online, and when it last checked in."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            Add classroom
          </Button>
        }
      />

      {error && !classrooms ? (
        <ErrorState
          title={error.status === 403 ? "Your account can't manage classrooms" : "Classrooms couldn't be loaded"}
          onRetry={error.status === 403 ? undefined : () => void reload()}
        >
          {error.status === 403 ? "Only school administrators can open this page." : "Check the internet connection, then try again."}
        </ErrorState>
      ) : !classrooms ? (
        <div className="rounded-panel border border-line">
          <LoadingRows rows={3} label="Loading classrooms" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-panel border border-line">
          <EmptyState
            title="No classrooms yet"
            icon={DoorOpen}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
                Add classroom
              </Button>
            }
          >
            Add a classroom, then add its device so alerts can start.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sorted.map((classroom) => {
            const roomDevices = devices.filter((device) => device.classroom_id === classroom.id);
            const count = weekCounts.get(classroom.id) ?? 0;
            return (
              <li key={classroom.id} className={`relative rounded-panel border border-line bg-bg p-4 hover:border-line-strong sm:p-5 ${classroom.is_active ? "" : "opacity-75"}`}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-title font-semibold text-ink">
                    <Link href={`/classrooms/${classroom.id}`} className="after:absolute after:inset-0 after:content-[''] hover:underline">
                      {classroom.name}
                    </Link>
                  </h2>
                  {!classroom.is_active && (
                    <span className="rounded-tag border border-line-strong px-1.5 py-0.5 text-small text-muted">Not in use</span>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {roomDevices.length === 0 ? (
                    <p className="flex items-center gap-2 text-body text-muted">
                      <Cpu className="h-4 w-4" aria-hidden="true" />
                      No device yet. Open the classroom to add one.
                    </p>
                  ) : (
                    roomDevices.map((device) => {
                      const status = statuses.get(device.id);
                      return (
                        <div key={device.id}>
                          <DeviceStatus lastSeenAt={device.last_seen_at} online={status?.online} disabled={!device.is_active} />
                          <p className="num mt-0.5 text-small text-muted">
                            {device.display_name}. Last check-in{" "}
                            {device.last_seen_at ? formatWhen(device.last_seen_at) : "never"}
                          </p>
                        </div>
                      );
                    })
                  )}
                  <p className="flex items-center gap-2 text-small text-muted">
                    <MapPinned className="h-4 w-4" aria-hidden="true" />
                    Area map not available yet
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-body">
                  <span className="num text-muted">
                    {count === 0 ? "No alerts this week" : `${count} ${count === 1 ? "alert" : "alerts"} this week`}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    Open
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {unplaced.length > 0 && (
        <section aria-labelledby="unplaced-title" className="mt-10">
          <h2 id="unplaced-title" className="text-title font-semibold text-ink">
            Devices not in a classroom
          </h2>
          <p className="mt-1 text-body text-muted">These devices can&apos;t send alerts until they are put in a classroom.</p>
          <ul className="mt-3 divide-y divide-line rounded-panel border border-line">
            {unplaced.map((device) => (
              <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-body-lg font-medium text-ink">{device.display_name}</p>
                  <DeviceStatus lastSeenAt={device.last_seen_at} online={statuses.get(device.id)?.online} disabled={!device.is_active} className="text-small" />
                </div>
                <Button size="sm" onClick={() => setPlacing(device)}>
                  Put in a classroom
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {adding && <ClassroomNameDialog pending={pending} onCancel={() => setAdding(false)} onSubmit={addClassroom} />}
      {placing && (
        <MoveDeviceDialog
          device={placing}
          classrooms={classrooms ?? []}
          pending={pending}
          onCancel={() => setPlacing(null)}
          onSubmit={placeDevice}
        />
      )}
    </Page>
  );
}
