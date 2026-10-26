"use client";

import { useState } from "react";
import AccessibleDialog from "@/components/AccessibleDialog";
import { Button, Field, FormError, inputClass, selectClass } from "@/components/ui";
import type { Classroom, EdgeDevice } from "@/lib/types";

function DialogActions({ pending, submitLabel, onCancel }: { pending: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" pending={pending}>
        {submitLabel}
      </Button>
    </div>
  );
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function ClassroomNameDialog({
  classroom,
  pending,
  onCancel,
  onSubmit,
}: {
  classroom?: Classroom;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(classroom?.name ?? "");
  const [error, setError] = useState("");
  return (
    <AccessibleDialog
      title={classroom ? "Rename classroom" : "Add classroom"}
      description={classroom ? undefined : "Use the name teachers know, such as Grade 6 or Room 12."}
      onClose={onCancel}
      closeDisabled={pending}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const value = normalize(name);
          if (!value) {
            setError("Enter a classroom name.");
            return;
          }
          setError("");
          void onSubmit(value);
        }}
      >
        <Field id="classroom-name" label="Classroom name">
          <input
            id="classroom-name"
            autoFocus
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "classroom-name-error" : undefined}
            className={inputClass}
          />
        </Field>
        {error && (
          <div className="mt-3">
            <FormError id="classroom-name-error">{error}</FormError>
          </div>
        )}
        <DialogActions pending={pending} submitLabel={classroom ? "Save name" : "Add classroom"} onCancel={onCancel} />
      </form>
    </AccessibleDialog>
  );
}

export function AddDeviceDialog({
  classroom,
  pending,
  onCancel,
  onSubmit,
}: {
  classroom: Classroom;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: { device_code: string; display_name: string }) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState(`${classroom.name} device`);
  const [error, setError] = useState("");
  return (
    <AccessibleDialog
      title={`Add a device to ${classroom.name}`}
      description="After you add it, EchoSense shows a key once. Enter that key on the device."
      onClose={onCancel}
      closeDisabled={pending}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const deviceCode = code.trim();
          const displayName = normalize(name);
          if (!/^[a-z0-9][a-z0-9._-]{2,99}$/.test(deviceCode)) {
            setError("The device ID needs 3 to 100 lowercase letters, numbers, dots, dashes or underscores.");
            return;
          }
          if (!displayName) {
            setError("Enter a device name.");
            return;
          }
          setError("");
          void onSubmit({ device_code: deviceCode, display_name: displayName });
        }}
        className="grid gap-4"
      >
        <Field id="device-name" label="Device name" hint="Shown to staff, for example Grade 6 device.">
          <input id="device-name" maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </Field>
        <Field id="device-code" label="Device ID" hint="Printed on the device setup sheet, for example grade6-pi-01.">
          <input
            id="device-code"
            autoFocus
            autoCapitalize="none"
            spellCheck={false}
            maxLength={100}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-describedby="device-code-hint"
            className={inputClass}
          />
        </Field>
        {error && <FormError>{error}</FormError>}
        <DialogActions pending={pending} submitLabel="Add device" onCancel={onCancel} />
      </form>
    </AccessibleDialog>
  );
}

export function RenameDeviceDialog({
  device,
  pending,
  onCancel,
  onSubmit,
}: {
  device: EdgeDevice;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(device.display_name);
  const [error, setError] = useState("");
  return (
    <AccessibleDialog title="Rename device" onClose={onCancel} closeDisabled={pending}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const value = normalize(name);
          if (!value) {
            setError("Enter a device name.");
            return;
          }
          void onSubmit(value);
        }}
      >
        <Field id="rename-device" label="Device name">
          <input id="rename-device" autoFocus maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </Field>
        {error && (
          <div className="mt-3">
            <FormError>{error}</FormError>
          </div>
        )}
        <DialogActions pending={pending} submitLabel="Save name" onCancel={onCancel} />
      </form>
    </AccessibleDialog>
  );
}

export function MoveDeviceDialog({
  device,
  classrooms,
  pending,
  onCancel,
  onSubmit,
}: {
  device: EdgeDevice;
  classrooms: Classroom[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (classroomId: string) => Promise<void>;
}) {
  const choices = classrooms.filter(
    (classroom) => classroom.is_active && classroom.id !== device.classroom_id && classroom.school_id === device.school_id
  );
  const [classroomId, setClassroomId] = useState(choices[0]?.id ?? "");
  return (
    <AccessibleDialog
      title={device.classroom_id ? "Move device to another classroom" : "Put device in a classroom"}
      description={`${device.display_name} will send alerts for the classroom you choose.`}
      onClose={onCancel}
      closeDisabled={pending}
    >
      {choices.length === 0 ? (
        <>
          <p className="text-body text-muted">There is no other active classroom yet. Add a classroom first.</p>
          <div className="mt-5 flex justify-end">
            <Button onClick={onCancel}>Close</Button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (classroomId) void onSubmit(classroomId);
          }}
        >
          <Field id="move-classroom" label="Classroom">
            <select id="move-classroom" value={classroomId} onChange={(event) => setClassroomId(event.target.value)} className={selectClass}>
              {choices.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </Field>
          <DialogActions pending={pending} submitLabel="Move device" onCancel={onCancel} />
        </form>
      )}
    </AccessibleDialog>
  );
}
