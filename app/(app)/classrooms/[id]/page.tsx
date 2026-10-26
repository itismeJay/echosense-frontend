"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, BellRing, Cpu, KeyRound, MapPinned, MoveRight, Pencil, Plus, Power } from "lucide-react";
import AlertInbox from "@/components/AlertInbox";
import { AddDeviceDialog, ClassroomNameDialog, MoveDeviceDialog, RenameDeviceDialog } from "@/components/classrooms/dialogs";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import DeviceSecretDialog from "@/components/multi-room/DeviceSecretDialog";
import { Button, Detail, EmptyState, ErrorState, LoadingRows, Page, Panel } from "@/components/ui";
import { DeviceStatus } from "@/components/ui/status";
import { useAlerts } from "@/lib/AlertsProvider";
import {
  ApiError,
  assignDevice,
  disableDevice,
  enableDevice,
  registerDevice,
  rotateDeviceKey,
  unassignDevice,
  updateClassroom,
  updateDevice,
} from "@/lib/api";
import { formatTimestamp, formatWhen } from "@/lib/format";
import { useClassroomData } from "@/lib/useClassroomData";
import type { DeviceRegistrationResult, EdgeDevice } from "@/lib/types";

type Confirmation =
  | { kind: "rotate" | "disable" | "unassign"; device: EdgeDevice }
  | { kind: "deactivate" | "reactivate" };

function BackLink() {
  return (
    <Link href="/classrooms" className="inline-flex min-h-11 items-center gap-2 text-body font-medium text-ink hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      All classrooms
    </Link>
  );
}

export default function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { classrooms, devices, statuses, error, reload } = useClassroomData();
  const { alerts } = useAlerts();
  const [dialog, setDialog] = useState<
    | { kind: "rename" }
    | { kind: "add-device" }
    | { kind: "rename-device"; device: EdgeDevice }
    | { kind: "move-device"; device: EdgeDevice }
    | null
  >(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [secret, setSecret] = useState<{ result: DeviceRegistrationResult; operation: "registered" | "rotated" } | null>(null);
  const [pending, setPending] = useState(false);

  const classroom = classrooms?.find((item) => item.id === id);
  const roomDevices = devices.filter((device) => device.classroom_id === id);
  const roomAlerts = useMemo(() => alerts.filter((alert) => alert.classroom_id === id).slice(0, 10), [alerts, id]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setPending(true);
    try {
      await action();
      toast.success(success);
      setDialog(null);
      setConfirmation(null);
      await reload();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError && caught.status === 409
          ? "Someone else just changed this. The page has been refreshed; try again."
          : caught instanceof Error
            ? `${caught.message} Nothing was changed.`
            : "Nothing was changed. Try again."
      );
      await reload();
    } finally {
      setPending(false);
    }
  };

  if (error && !classrooms) {
    return (
      <Page>
        <BackLink />
        <div className="mt-6 max-w-2xl">
          <ErrorState title="This classroom couldn't be loaded" onRetry={() => void reload()}>
            Check the internet connection, then try again.
          </ErrorState>
        </div>
      </Page>
    );
  }
  if (!classrooms) {
    return (
      <Page>
        <BackLink />
        <div className="mt-6 rounded-panel border border-line">
          <LoadingRows rows={3} label="Loading classroom" />
        </div>
      </Page>
    );
  }
  if (!classroom) {
    return (
      <Page>
        <BackLink />
        <h1 className="mt-6 text-display font-semibold text-ink">Classroom not found</h1>
        <p className="mt-2 text-body-lg text-muted">It may belong to another school. Go back to All classrooms to pick one.</p>
      </Page>
    );
  }

  const confirmText: Record<Confirmation["kind"], { title: string; description: string; label: string; tone: "danger" | "primary" }> = {
    rotate: {
      title: "Create a new device key?",
      description: "The old key stops working right away. Enter the new key on the device, or it will stop sending alerts.",
      label: "Create new key",
      tone: "danger",
    },
    disable: {
      title: "Turn off this device?",
      description: "It stops sending alerts until you turn it back on. Past alerts stay.",
      label: "Turn off device",
      tone: "danger",
    },
    unassign: {
      title: "Take this device out of the classroom?",
      description: "It stops sending alerts for this classroom. You can put it in another classroom later.",
      label: "Take out of classroom",
      tone: "danger",
    },
    deactivate: {
      title: `Stop using ${classroom.name}?`,
      description: "The classroom is kept with its past alerts, but devices can't be added to it.",
      label: "Stop using classroom",
      tone: "danger",
    },
    reactivate: {
      title: `Start using ${classroom.name} again?`,
      description: "Devices can be added to it again.",
      label: "Use classroom again",
      tone: "primary",
    },
  };

  const confirmActive = async () => {
    if (!confirmation) return;
    if (confirmation.kind === "deactivate" || confirmation.kind === "reactivate") {
      const active = confirmation.kind === "reactivate";
      await run(() => updateClassroom(classroom.id, { is_active: active }), active ? "Classroom in use again" : "Classroom no longer in use");
      return;
    }
    if (!("device" in confirmation)) return;
    const device = confirmation.device;
    if (confirmation.kind === "rotate") {
      setPending(true);
      try {
        const result = await rotateDeviceKey(device.id);
        setConfirmation(null);
        setSecret({ result, operation: "rotated" });
        await reload();
      } catch (caught) {
        toast.error(caught instanceof Error ? `${caught.message} The old key still works.` : "The old key still works. Try again.");
      } finally {
        setPending(false);
      }
      return;
    }
    if (confirmation.kind === "disable") await run(() => disableDevice(device.id), "Device turned off");
    if (confirmation.kind === "unassign") await run(() => unassignDevice(device.id), "Device taken out of the classroom");
  };

  return (
    <Page>
      <BackLink />
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-display font-semibold text-ink">{classroom.name}</h1>
          <p className="mt-1 text-body-lg text-muted">
            {classroom.is_active ? classroom.school_name : `${classroom.school_name}. This classroom is not in use.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={Pencil} onClick={() => setDialog({ kind: "rename" })}>
            Rename
          </Button>
          <Button
            variant={classroom.is_active ? "danger" : "secondary"}
            icon={Power}
            onClick={() => setConfirmation({ kind: classroom.is_active ? "deactivate" : "reactivate" })}
          >
            {classroom.is_active ? "Stop using" : "Use again"}
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="Device"
          description="Listens in the classroom and sends alerts."
          actions={
            classroom.is_active && (
              <Button size="sm" icon={Plus} onClick={() => setDialog({ kind: "add-device" })}>
                Add device
              </Button>
            )
          }
          bodyClassName=""
        >
          {roomDevices.length === 0 ? (
            <EmptyState
              title="No device in this classroom"
              icon={Cpu}
              action={
                classroom.is_active && (
                  <Button variant="primary" icon={Plus} onClick={() => setDialog({ kind: "add-device" })}>
                    Add device
                  </Button>
                )
              }
            >
              Add the classroom&apos;s device so EchoSense can send alerts from this room.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {roomDevices.map((device) => (
                <li key={device.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-body-lg font-medium text-ink">{device.display_name}</p>
                      <DeviceStatus lastSeenAt={device.last_seen_at} online={statuses.get(device.id)?.online} disabled={!device.is_active} className="mt-1" />
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Detail label="Last check-in">
                      <span className="num">{device.last_seen_at ? formatTimestamp(device.last_seen_at) : "Never checked in"}</span>
                    </Detail>
                    <Detail label="Device ID">
                      <span className="break-all">{device.device_code}</span>
                    </Detail>
                    <Detail label="Key created">
                      <span className="num">{formatWhen(device.key_rotated_at ?? device.created_at)}</span>
                    </Detail>
                    <Detail label="In this classroom since">
                      <span className="num">{device.assigned_at ? formatWhen(device.assigned_at) : "Not recorded"}</span>
                    </Detail>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" icon={KeyRound} onClick={() => setConfirmation({ kind: "rotate", device })}>
                      New key
                    </Button>
                    <Button size="sm" icon={MoveRight} onClick={() => setDialog({ kind: "move-device", device })}>
                      Move
                    </Button>
                    <Button size="sm" icon={Pencil} onClick={() => setDialog({ kind: "rename-device", device })}>
                      Rename
                    </Button>
                    {device.is_active ? (
                      <Button size="sm" variant="danger" icon={Power} onClick={() => setConfirmation({ kind: "disable", device })}>
                        Turn off
                      </Button>
                    ) : (
                      <Button size="sm" icon={Power} pending={pending} onClick={() => void run(() => enableDevice(device.id), "Device turned on")}>
                        Turn on
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setConfirmation({ kind: "unassign", device })}>
                      Take out of classroom
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Area map" bodyClassName="">
          <EmptyState title="Not available yet" icon={MapPinned}>
            A map of where sounds happen in the room will appear here when classroom devices report location. There is
            nothing to set up.
          </EmptyState>
        </Panel>
      </div>

      <section aria-labelledby="room-alerts-title" className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 id="room-alerts-title" className="text-title font-semibold text-ink">
            Recent alerts from this classroom
          </h2>
          <Link
            href={`/alerts/all?classroom=${encodeURIComponent(classroom.name)}`}
            className="min-h-11 content-center text-body font-medium text-link underline-offset-4 hover:underline"
          >
            See all alerts from {classroom.name}
          </Link>
        </div>
        {roomAlerts.length === 0 ? (
          <div className="rounded-panel border border-line">
            <EmptyState title="No alerts from this classroom" icon={BellRing}>
              New alerts from {classroom.name} appear here and on Alerts.
            </EmptyState>
          </div>
        ) : (
          <AlertInbox alerts={roomAlerts} mode="all" label={`Recent alerts from ${classroom.name}`} />
        )}
      </section>

      {dialog?.kind === "rename" && (
        <ClassroomNameDialog
          classroom={classroom}
          pending={pending}
          onCancel={() => setDialog(null)}
          onSubmit={(name) => run(() => updateClassroom(classroom.id, { name }), "Classroom renamed")}
        />
      )}
      {dialog?.kind === "add-device" && (
        <AddDeviceDialog
          classroom={classroom}
          pending={pending}
          onCancel={() => setDialog(null)}
          onSubmit={async (input) => {
            setPending(true);
            try {
              const result = await registerDevice({ ...input, school_id: classroom.school_id, classroom_id: classroom.id });
              setDialog(null);
              setSecret({ result, operation: "registered" });
              await reload();
            } catch (caught) {
              toast.error(caught instanceof Error ? `${caught.message} The device was not added.` : "The device was not added.");
            } finally {
              setPending(false);
            }
          }}
        />
      )}
      {dialog?.kind === "rename-device" && (
        <RenameDeviceDialog
          device={dialog.device}
          pending={pending}
          onCancel={() => setDialog(null)}
          onSubmit={(name) => run(() => updateDevice(dialog.device.id, { display_name: name }), "Device renamed")}
        />
      )}
      {dialog?.kind === "move-device" && (
        <MoveDeviceDialog
          device={dialog.device}
          classrooms={classrooms}
          pending={pending}
          onCancel={() => setDialog(null)}
          onSubmit={(classroomId) =>
            run(
              () =>
                assignDevice(dialog.device.id, {
                  classroom_id: classroomId,
                  expected_current_classroom_id: dialog.device.classroom_id,
                }),
              "Device moved"
            )
          }
        />
      )}
      {confirmation && (
        <ConfirmDialog
          title={confirmText[confirmation.kind].title}
          description={confirmText[confirmation.kind].description}
          confirmLabel={confirmText[confirmation.kind].label}
          tone={confirmText[confirmation.kind].tone}
          pending={pending}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void confirmActive()}
        />
      )}
      {secret && <DeviceSecretDialog result={secret.result} operation={secret.operation} onClose={() => setSecret(null)} />}
    </Page>
  );
}
