"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Package, Plus, RotateCcw } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import ProvisionedBoxesDialog from "@/components/devices/BoxLabels";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import { Button, EmptyState, ErrorState, Field, FormError, LoadingRows, Page, PageHeader, inputClass } from "@/components/ui";
import { DeviceStatus } from "@/components/ui/status";
import { getDeviceStatuses, getDevices, provisionBoxes, resetBox } from "@/lib/api";
import { BOX_STATUS_LABEL, lifecycleOf } from "@/lib/device-setup";
import { formatTimestamp } from "@/lib/format";
import { clearSchoolScope } from "@/lib/school-scope";
import type { DeviceStatusItem, EdgeDevice, ProvisionedBox } from "@/lib/types";

const STATUS_ORDER = { unclaimed: 0, claimed: 1, active: 2, disabled: 3, removed: 4 } as const;

function NewBoxesDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (boxes: ProvisionedBox[]) => void }) {
  const [count, setCount] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <AccessibleDialog
      title="New boxes"
      description="Each box gets a device code and a one-time setup code for its QR label."
      onClose={onClose}
      closeDisabled={pending}
    >
      <form
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          const value = Number(count);
          if (!Number.isInteger(value) || value < 1 || value > 50) {
            setError("Enter a number from 1 to 50.");
            return;
          }
          setPending(true);
          setError("");
          try {
            onCreated(await provisionBoxes(value));
          } catch (caught) {
            setError(caught instanceof Error ? `${caught.message} No boxes were made.` : "No boxes were made. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Field id="box-count" label="How many boxes">
          <input
            id="box-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            autoFocus
            value={count}
            onChange={(event) => setCount(event.target.value)}
            className={inputClass}
          />
        </Field>
        {error && (
          <div className="mt-3">
            <FormError>{error}</FormError>
          </div>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" pending={pending}>
            Make boxes
          </Button>
        </div>
      </form>
    </AccessibleDialog>
  );
}

export default function BoxesPage() {
  const [devices, setDevices] = useState<EdgeDevice[] | null>(null);
  const [statuses, setStatuses] = useState<Map<string, DeviceStatusItem>>(new Map());
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState<ProvisionedBox[] | null>(null);
  const [resetting, setResetting] = useState<EdgeDevice | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [list, status] = await Promise.all([getDevices(), getDeviceStatuses().catch(() => null)]);
      setDevices(list);
      if (status) setStatuses(new Map(status.devices.map((item) => [item.id, item])));
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    // Boxes is platform mode: leave any school the super admin was viewing.
    clearSchoolScope();
    const first = setTimeout(() => void load(), 0);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [load]);

  const sorted = useMemo(
    () =>
      [...(devices ?? [])].sort(
        (a, b) =>
          STATUS_ORDER[lifecycleOf(a)] - STATUS_ORDER[lifecycleOf(b)] || a.device_code.localeCompare(b.device_code)
      ),
    [devices]
  );

  const confirmReset = async () => {
    if (!resetting) return;
    setPending(true);
    try {
      const box = await resetBox(resetting.id);
      setResetting(null);
      setReady([box]);
      toast.success(`${box.device_code} reset`);
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? `${caught.message} Nothing was changed.` : "Nothing was changed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Boxes"
        description="Every EchoSense box: ready to add, waiting, or in a classroom. School admins add a box by scanning its label."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            New boxes
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Boxes couldn't be loaded" onRetry={() => void load()}>
          Check the internet connection, then try again.
        </ErrorState>
      ) : !devices ? (
        <div className="rounded-panel border border-line">
          <LoadingRows rows={3} label="Loading boxes" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-panel border border-line">
          <EmptyState
            title="No boxes yet"
            icon={Package}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
                New boxes
              </Button>
            }
          >
            Make a box, print its label and copy its identity file onto it.
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line">
          <table className="w-full min-w-[720px] text-left text-body">
            <thead className="border-b border-line bg-surface text-small text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Box</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">School and room</th>
                <th scope="col" className="px-4 py-3 font-medium">Online</th>
                <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((device) => {
                const status = lifecycleOf(device);
                const live = statuses.get(device.id);
                return (
                  <tr key={device.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium text-ink">{device.device_code}</p>
                      <p className="text-small text-muted">{device.display_name}</p>
                    </td>
                    <td className="px-4 py-3 text-ink">{BOX_STATUS_LABEL[status]}</td>
                    <td className="px-4 py-3 text-ink">
                      {device.school_name ? (
                        <>
                          {device.school_name}
                          <span className="block text-small text-muted">{device.classroom_name ?? "No classroom"}</span>
                        </>
                      ) : (
                        <span className="text-muted">Not in a school</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {status === "unclaimed" || status === "removed" ? (
                        <span className="num text-small text-muted">
                          {device.last_seen_at ? `Box last on ${formatTimestamp(device.last_seen_at)}` : "Never turned on"}
                        </span>
                      ) : (
                        <DeviceStatus lastSeenAt={device.last_seen_at} online={live?.online} disabled={status === "disabled"} className="text-small" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" icon={RotateCcw} onClick={() => setResetting(device)}>
                        Reset
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <NewBoxesDialog
          onClose={() => setCreating(false)}
          onCreated={(boxes) => {
            setCreating(false);
            setReady(boxes);
            void load();
          }}
        />
      )}
      {resetting && (
        <ConfirmDialog
          title={`Reset box ${resetting.device_code}?`}
          description={
            resetting.school_name
              ? `It leaves ${resetting.school_name}${resetting.classroom_name ? `, ${resetting.classroom_name}` : ""} and its key stops working right away. You get a new label and identity file; the old sticker stops working.`
              : "It gets a new label and identity file; the old sticker stops working."
          }
          confirmLabel="Reset box"
          tone="danger"
          pending={pending}
          onCancel={() => setResetting(null)}
          onConfirm={() => void confirmReset()}
        />
      )}
      {ready && <ProvisionedBoxesDialog boxes={ready} onClose={() => setReady(null)} />}
    </Page>
  );
}
