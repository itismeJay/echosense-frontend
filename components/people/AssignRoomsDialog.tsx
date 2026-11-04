"use client";

import { FormEvent, useState } from "react";
import { DoorOpen } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import { Button, ButtonLink, EmptyState, FormError, Note } from "@/components/ui";
import type { Classroom, User } from "@/lib/types";

interface AssignRoomsDialogProps {
  person: User;
  classrooms: Classroom[];
  pending: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (classroomIds: string[]) => void;
}

/** Pick the classrooms a teacher sees and gets phone alerts for. */
export default function AssignRoomsDialog({
  person,
  classrooms,
  pending,
  error,
  onCancel,
  onSubmit,
}: AssignRoomsDialogProps) {
  const inUse = classrooms.filter((room) => room.is_active);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((person.classroom_ids ?? []).filter((id) => inUse.some((room) => room.id === id)))
  );

  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(inUse.filter((room) => selected.has(room.id)).map((room) => room.id));
  };

  return (
    <AccessibleDialog
      title={`Rooms for ${person.email}`}
      description="They see alerts and get phone alerts only from these classrooms."
      onClose={onCancel}
      closeDisabled={pending}
    >
      {inUse.length === 0 ? (
        <EmptyState
          title="No classrooms yet"
          icon={DoorOpen}
          action={<ButtonLink href="/classrooms">Add a classroom</ButtonLink>}
        >
          Add the school&apos;s classrooms first, then come back to give this teacher their rooms.
        </EmptyState>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Classrooms</legend>
            {inUse.map((room) => {
              const on = selected.has(room.id);
              return (
                <label
                  key={room.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-3 text-body ${
                    on ? "border-ink text-ink" : "border-line-strong text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(event) => toggle(room.id, event.target.checked)}
                    className="h-4 w-4"
                  />
                  {room.name}
                </label>
              );
            })}
          </fieldset>
          {selected.size === 0 && (
            <Note>With no room, this teacher sees no alerts and gets no phone alerts.</Note>
          )}
          {error && <FormError>{error}</FormError>}
          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" pending={pending}>
              Save rooms
            </Button>
          </div>
        </form>
      )}
    </AccessibleDialog>
  );
}
