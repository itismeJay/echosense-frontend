"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Keyboard, LoaderCircle, ScanLine, Wrench } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import QrScanner from "@/components/devices/QrScanner";
import { Button, Field, FormError, inputClass } from "@/components/ui";
import { ApiError, claimDevice, getDevice, getDeviceStatuses } from "@/lib/api";
import { SETUP_PHASE_TEXT, checkTypedCodes, setupPhase, type ClaimCodes, type SetupPhase } from "@/lib/device-setup";
import type { Classroom, EdgeDevice } from "@/lib/types";

const POLL_MS = 3000;

type Method = "scan" | "type";

function claimErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError) {
    if (caught.status === 429) return caught.message || "Too many wrong codes. Wait a few minutes, then try again.";
    return caught.message;
  }
  return caught instanceof Error ? caught.message : "The box was not added. Try again.";
}

/** Live status of a box that was just added: waiting for the box, then online. */
function SetupStatus({ device, onDone }: { device: EdgeDevice; onDone: () => void }) {
  const [phase, setPhase] = useState<SetupPhase>("waiting");
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const [current, statuses] = await Promise.all([getDevice(device.id), getDeviceStatuses()]);
        if (cancelled) return;
        const online = statuses.devices.find((item) => item.id === device.id)?.online;
        const next = setupPhase(current.classroom_id === device.classroom_id ? current : null, online);
        setPhase(next);
        setCheckFailed(false);
        if (next === "online" || next === "gone") return;
      } catch {
        if (cancelled) return;
        setCheckFailed(true);
      }
      timer = setTimeout(() => void check(), POLL_MS);
    };
    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [device.id, device.classroom_id]);

  const text = SETUP_PHASE_TEXT[phase];
  const done = phase === "online";
  return (
    <div>
      <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-panel border border-line p-4">
        {done ? (
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-ink" aria-hidden="true" />
        ) : (
          <LoaderCircle className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-muted" aria-hidden="true" />
        )}
        <div>
          <p className="text-body-lg font-semibold text-ink">{text.title}</p>
          <p className="mt-1 text-body text-muted">{text.body}</p>
          {checkFailed && <p className="mt-2 text-small text-muted">Couldn&apos;t check just now. Trying again…</p>}
        </div>
      </div>
      <p className="mt-3 text-small text-muted">
        Device <span className="font-medium text-ink">{device.device_code}</span> is now in {device.classroom_name}.
        {!done && " You can close this; the classroom page shows when it comes online."}
      </p>
      <div className="mt-5 flex justify-end">
        <Button variant={done ? "primary" : "secondary"} onClick={onDone}>
          {done ? "Done" : "Close"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Classrooms > Add device: scan the box's QR sticker (or type its codes). The box then
 * connects by itself; nobody sees or copies a device key. "Advanced" opens the old
 * manual-key flow for boxes set up by hand.
 */
export default function AddDeviceFlow({
  classroom,
  onClose,
  onAdded,
  onAdvanced,
}: {
  classroom: Classroom;
  onClose: () => void;
  onAdded: () => Promise<void> | void;
  onAdvanced: () => void;
}) {
  const [method, setMethod] = useState<Method>("scan");
  const [deviceCode, setDeviceCode] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState<EdgeDevice | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const claim = async (codes: ClaimCodes) => {
    setPending(true);
    setError("");
    try {
      const device = await claimDevice(classroom.id, codes);
      setAdded(device);
      await onAdded();
    } catch (caught) {
      setError(claimErrorMessage(caught));
      // Start the camera again so they can rescan.
      setScanKey((count) => count + 1);
    } finally {
      setPending(false);
    }
  };

  if (added) {
    return (
      <AccessibleDialog title={`Box added to ${classroom.name}`} onClose={onClose}>
        <SetupStatus device={added} onDone={onClose} />
      </AccessibleDialog>
    );
  }

  const tabClass = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-body font-medium ${
      active ? "border-ink bg-ink text-bg" : "border-line-strong text-ink hover:bg-surface"
    }`;

  return (
    <AccessibleDialog
      title={`Add a device to ${classroom.name}`}
      description="Scan the QR sticker on the EchoSense box. The box connects by itself; there is no key to copy."
      onClose={onClose}
      closeDisabled={pending}
      size="large"
    >
      <div role="tablist" aria-label="How to add the box" className="mb-4 flex flex-wrap gap-2">
        <button type="button" role="tab" aria-selected={method === "scan"} className={tabClass(method === "scan")} onClick={() => { setMethod("scan"); setError(""); }}>
          <ScanLine className="h-4 w-4" aria-hidden="true" />
          Scan QR
        </button>
        <button type="button" role="tab" aria-selected={method === "type"} className={tabClass(method === "type")} onClick={() => { setMethod("type"); setError(""); }}>
          <Keyboard className="h-4 w-4" aria-hidden="true" />
          Type code instead
        </button>
      </div>

      {method === "scan" ? (
        pending ? (
          <p role="status" className="flex items-center gap-2 py-8 text-body text-ink">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Adding the box…
          </p>
        ) : (
          <QrScanner key={scanKey} onCodes={(codes) => void claim(codes)} />
        )
      ) : (
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const checked = checkTypedCodes(deviceCode, claimCode);
            if (!checked.ok) {
              setError(checked.error);
              return;
            }
            void claim(checked.codes);
          }}
        >
          <Field id="claim-device-code" label="Device code" hint="On the sticker, for example es-7k3m.">
            <input
              id="claim-device-code"
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              maxLength={100}
              value={deviceCode}
              onChange={(event) => setDeviceCode(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id="claim-setup-code" label="Setup code" hint="12 letters and numbers under “Setup code”, for example ABCD-EFGH-JKMN.">
            <input
              id="claim-setup-code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              value={claimCode}
              onChange={(event) => setClaimCode(event.target.value)}
              className={`${inputClass} font-mono tracking-wider`}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" pending={pending}>
              Add box
            </Button>
          </div>
        </form>
      )}

      {error && (
        <div className="mt-3">
          <FormError>{error}</FormError>
        </div>
      )}

      <details className="mt-6 border-t border-line pt-4">
        <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body font-medium text-ink">
          <Wrench className="h-4 w-4" aria-hidden="true" /> Advanced
        </summary>
        <p className="mt-2 text-small text-muted">
          For a box that was set up by hand without a sticker: register a device ID and get a key to enter on the box yourself.
        </p>
        <div className="mt-3">
          <Button size="sm" onClick={onAdvanced} disabled={pending}>
            Add with a device key
          </Button>
        </div>
      </details>
    </AccessibleDialog>
  );
}
