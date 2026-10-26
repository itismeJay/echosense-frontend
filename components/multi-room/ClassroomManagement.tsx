"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DoorOpen, Pencil, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import AccessibleDialog from "@/components/AccessibleDialog";
import { canFilterBySchool } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { ApiError, createClassroom, getClassrooms, updateClassroom } from "@/lib/api";
import { schoolSummariesFromResources } from "@/lib/multi-room-contract";
import { selectableSchools } from "@/lib/user-admin";
import { useSchools } from "@/lib/useSchools";
import type { Classroom, SchoolSummary } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import ResourceError from "./ResourceError";
import StatusBadge from "./StatusBadge";

const INPUT =
  "min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink       ";

interface ClassroomFormProps {
  classroom?: Classroom;
  schoolId: string | null;
  schools: SchoolSummary[];
  isSuperAdmin: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (name: string, schoolId: string) => Promise<void>;
}

function ClassroomForm({
  classroom,
  schoolId,
  schools,
  isSuperAdmin,
  pending,
  onCancel,
  onSubmit,
}: ClassroomFormProps) {
  const [name, setName] = useState(classroom?.name ?? "");
  const [selectedSchoolId, setSelectedSchoolId] = useState(
    classroom?.school_id ?? schoolId ?? schools[0]?.id ?? ""
  );
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      setError("Enter a classroom name.");
      return;
    }
    if (!selectedSchoolId) {
      setError("A school is required. No selectable school is available.");
      return;
    }
    setError("");
    await onSubmit(normalizedName, selectedSchoolId);
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div>
        <label htmlFor="classroom-name" className="mb-1.5 block text-sm font-semibold text-ink">
          Classroom name
        </label>
        <input
          id="classroom-name"
          required
          maxLength={200}
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Classroom A101"
          className={INPUT}
        />
      </div>

      {!classroom && isSuperAdmin && (
        <div className="mt-4">
          <label htmlFor="classroom-school" className="mb-1.5 block text-sm font-semibold text-ink">
            School
          </label>
          <select
            id="classroom-school"
            required
            value={selectedSchoolId}
            onChange={(event) => setSelectedSchoolId(event.target.value)}
            className={INPUT}
          >
            <option value="">Select a school</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          {schools.length === 0 && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              No school IDs are available from existing authorized classroom data.
            </p>
          )}
        </div>
      )}

      {!isSuperAdmin && schoolId && !classroom && (
        <p className="mt-4 text-sm text-muted">
          The classroom will be created in your assigned school.
        </p>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={pending || !selectedSchoolId} className="min-h-11 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving…" : classroom ? "Save changes" : "Create classroom"}
        </button>
      </div>
    </form>
  );
}

export default function ClassroomManagement() {
  const user = useCurrentUser();
  const superAdmin = canFilterBySchool(user);
  const { schools: registeredSchools } = useSchools(superAdmin);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Classroom | null>(null);
  const [deactivating, setDeactivating] = useState<Classroom | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClassrooms(await getClassrooms());
      setError(null);
      setErrorStatus(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Classrooms are unavailable.");
      setErrorStatus(caught instanceof ApiError ? caught.status : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Super admins pick from GET /schools so a new school without classrooms is selectable.
  const schools = useMemo(
    () =>
      superAdmin
        ? selectableSchools(registeredSchools)
        : schoolSummariesFromResources(classrooms),
    [classrooms, registeredSchools, superAdmin]
  );
  const visibleClassrooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classrooms.filter((classroom) => {
      if (superAdmin && schoolFilter && classroom.school_id !== schoolFilter) return false;
      if (status === "active" && !classroom.is_active) return false;
      if (status === "inactive" && classroom.is_active) return false;
      return (
        !query ||
        classroom.name.toLowerCase().includes(query) ||
        classroom.school_name.toLowerCase().includes(query) ||
        classroom.devices.some(
          (device) =>
            device.display_name.toLowerCase().includes(query) ||
            device.device_code.toLowerCase().includes(query)
        )
      );
    });
  }, [classrooms, schoolFilter, search, status, superAdmin]);

  const handleCreate = async (name: string, schoolId: string) => {
    setPending(true);
    try {
      await createClassroom({ name, school_id: schoolId });
      setShowCreate(false);
      toast.success("Classroom created.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to create classroom.");
    } finally {
      setPending(false);
    }
  };

  const handleRename = async (name: string) => {
    if (!editing) return;
    setPending(true);
    try {
      await updateClassroom(editing.id, { name });
      setEditing(null);
      toast.success("Classroom updated.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to update classroom.");
    } finally {
      setPending(false);
    }
  };

  const setClassroomActive = async (classroom: Classroom, active: boolean) => {
    setPending(true);
    try {
      await updateClassroom(classroom.id, { is_active: active });
      setDeactivating(null);
      toast.success(active ? "Classroom reactivated." : "Classroom deactivated.");
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to update classroom.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-link">Multi-Room Management</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Classrooms</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Manage classrooms and their EchoSense devices.</p>
        </div>
        {user && (
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add classroom
          </button>
        )}
      </header>

      <section aria-label="Classroom filters" className={`mb-6 grid gap-4 rounded-panel border border-line bg-bg p-4    ${superAdmin ? "sm:grid-cols-[1fr_14rem_14rem]" : "sm:grid-cols-[1fr_14rem]"}`}>
        <div>
          <label htmlFor="classroom-search" className="mb-1.5 block text-sm font-semibold text-ink">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="classroom-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Classroom, school, or device" className={`${INPUT} pl-10`} />
          </div>
        </div>
        {superAdmin && (
          <div>
            <label htmlFor="classroom-school-filter" className="mb-1.5 block text-sm font-semibold text-ink">School</label>
            <select id="classroom-school-filter" value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className={INPUT}>
              <option value="">All schools</option>
              {registeredSchools.map((school) => <option key={school.id} value={school.id}>{school.name}{school.is_active ? "" : " (inactive)"}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="classroom-status" className="mb-1.5 block text-sm font-semibold text-ink">Status</label>
          <select id="classroom-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={INPUT}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </section>

      {error && <ResourceError title="We couldn’t load classrooms." message={error} status={errorStatus} onRetry={() => void load()} />}

      {loading && classrooms.length === 0 ? (
        <div aria-label="Loading classrooms" className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-panel bg-surface" />)}
        </div>
      ) : !error && visibleClassrooms.length === 0 ? (
        <section className="rounded-panel border border-dashed border-line-strong bg-bg px-6 py-16 text-center">
          <DoorOpen className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink">{classrooms.length === 0 ? "No classrooms have been created yet." : "No classrooms found."}</h2>
          {classrooms.length === 0 && user && <button type="button" onClick={() => setShowCreate(true)} className="mt-4 min-h-11 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-hover">Add classroom</button>}
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleClassrooms.map((classroom) => (
            <article key={classroom.id} className="rounded-panel border border-line bg-bg p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-ink">{classroom.name}</h2>
                  <p className="mt-1 text-sm text-muted">{classroom.school_name}</p>
                </div>
                <StatusBadge active={classroom.is_active} />
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink">Devices ({classroom.devices.length})</p>
                {classroom.devices.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No device assigned</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm text-muted">
                    {classroom.devices.slice(0, 3).map((device) => <li key={device.id} className="truncate">{device.display_name} <span className="font-mono text-xs">({device.device_code})</span></li>)}
                    {classroom.devices.length > 3 && <li>+{classroom.devices.length - 3} more</li>}
                  </ul>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/classrooms/${classroom.id}`} className="inline-flex min-h-11 items-center justify-center rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface">View</Link>
                <button type="button" onClick={() => setEditing(classroom)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"><Pencil className="h-4 w-4" aria-hidden="true" /> Edit</button>
                {classroom.is_active ? (
                  <button type="button" onClick={() => setDeactivating(classroom)} className="min-h-11 rounded-control px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30">Deactivate</button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => void setClassroomActive(classroom, true)} className="min-h-11 rounded-control px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30">Reactivate</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showCreate && (
        <AccessibleDialog title="Add classroom" description="Create a classroom in an authorized school." onClose={() => setShowCreate(false)} closeDisabled={pending}>
          <ClassroomForm schoolId={user?.school_id ?? null} schools={schools} isSuperAdmin={superAdmin} pending={pending} onCancel={() => setShowCreate(false)} onSubmit={handleCreate} />
        </AccessibleDialog>
      )}
      {editing && (
        <AccessibleDialog title={`Edit ${editing.name}`} description="Rename this classroom. Assignment changes are managed from Devices." onClose={() => setEditing(null)} closeDisabled={pending}>
          <ClassroomForm classroom={editing} schoolId={editing.school_id} schools={schools} isSuperAdmin={superAdmin} pending={pending} onCancel={() => setEditing(null)} onSubmit={(name) => handleRename(name)} />
        </AccessibleDialog>
      )}
      {deactivating && (
        <ConfirmDialog title={`Deactivate ${deactivating.name}?`} description="Assigned devices will remain assigned, but the backend will reject new alerts attributed to this classroom while it is inactive." confirmLabel="Deactivate classroom" pending={pending} onCancel={() => setDeactivating(null)} onConfirm={() => void setClassroomActive(deactivating, false)} />
      )}
    </div>
  );
}
