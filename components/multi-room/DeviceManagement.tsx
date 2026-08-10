"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Cpu, KeyRound, Pencil, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import AccessibleDialog from "@/components/AccessibleDialog";
import { useCurrentUser } from "@/lib/auth";
import {
  ApiError,
  assignDevice,
  disableDevice,
  enableDevice,
  getClassrooms,
  getDevices,
  registerDevice,
  rotateDeviceKey,
  unassignDevice,
  updateDevice,
} from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { schoolSummariesFromResources } from "@/lib/multi-room-contract";
import type {
  Classroom,
  DeviceRegistrationResult,
  EdgeDevice,
  SchoolSummary,
} from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import DeviceSecretDialog from "./DeviceSecretDialog";
import ResourceError from "./ResourceError";
import StatusBadge from "./StatusBadge";

const INPUT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

interface RegisterDeviceFormProps {
  schoolId: string | null;
  isSuperAdmin: boolean;
  schools: SchoolSummary[];
  classrooms: Classroom[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    device_code: string;
    display_name: string;
    school_id: string;
    classroom_id?: string;
  }) => Promise<void>;
}

function RegisterDeviceForm({
  schoolId,
  isSuperAdmin,
  schools,
  classrooms,
  pending,
  onCancel,
  onSubmit,
}: RegisterDeviceFormProps) {
  const [deviceCode, setDeviceCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState(
    schoolId ?? schools[0]?.id ?? ""
  );
  const [classroomId, setClassroomId] = useState("");
  const [error, setError] = useState("");
  const availableClassrooms = classrooms.filter(
    (classroom) =>
      classroom.is_active && classroom.school_id === selectedSchoolId
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = deviceCode.trim();
    const name = displayName.trim().replace(/\s+/g, " ");
    if (!/^[a-z0-9][a-z0-9._-]{2,99}$/.test(code)) {
      setError("Use 3–100 lowercase letters, numbers, dots, underscores, or hyphens for the device code.");
      return;
    }
    if (!name) {
      setError("Enter a display name.");
      return;
    }
    if (!selectedSchoolId) {
      setError("A school is required. No selectable school is available.");
      return;
    }
    setError("");
    await onSubmit({
      device_code: code,
      display_name: name,
      school_id: selectedSchoolId,
      ...(classroomId ? { classroom_id: classroomId } : {}),
    });
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div className="grid gap-4">
        <div>
          <label htmlFor="device-code" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Device code</label>
          <input id="device-code" required minLength={3} maxLength={100} autoFocus autoCapitalize="none" spellCheck={false} value={deviceCode} onChange={(event) => setDeviceCode(event.target.value)} placeholder="classroom-pi-01" className={INPUT} />
        </div>
        <div>
          <label htmlFor="device-name" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Display name</label>
          <input id="device-name" required maxLength={200} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="EchoSense Device 01" className={INPUT} />
        </div>
        {isSuperAdmin && (
          <div>
            <label htmlFor="device-school" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">School</label>
            <select id="device-school" required value={selectedSchoolId} onChange={(event) => { setSelectedSchoolId(event.target.value); setClassroomId(""); }} className={INPUT}>
              <option value="">Select a school</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="device-classroom" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Classroom (optional)</label>
          <select id="device-classroom" value={classroomId} onChange={(event) => setClassroomId(event.target.value)} className={INPUT} disabled={!selectedSchoolId}>
            <option value="">Register as unassigned</option>
            {availableClassrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
        <button type="submit" disabled={pending || !selectedSchoolId} className="min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Registering…" : "Register device"}</button>
      </div>
    </form>
  );
}

function EditDeviceForm({ device, pending, onCancel, onSubmit }: { device: EdgeDevice; pending: boolean; onCancel: () => void; onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState(device.display_name);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) { setError("Enter a display name."); return; }
    setError("");
    await onSubmit(normalized);
  };
  return <form onSubmit={(event) => void submit(event)}><label htmlFor="edit-device-name" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Display name</label><input id="edit-device-name" required maxLength={200} autoFocus value={name} onChange={(event) => setName(event.target.value)} className={INPUT} />{error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button><button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save changes"}</button></div></form>;
}

function AssignmentForm({ device, classrooms, isSuperAdmin, pending, onCancel, onSubmit }: { device: EdgeDevice; classrooms: Classroom[]; isSuperAdmin: boolean; pending: boolean; onCancel: () => void; onSubmit: (classroomId: string) => Promise<void> }) {
  const choices = classrooms.filter((classroom) => classroom.is_active && (isSuperAdmin || classroom.school_id === device.school_id));
  const [classroomId, setClassroomId] = useState(choices.find((classroom) => classroom.id !== device.classroom_id)?.id ?? "");
  return <form onSubmit={(event) => { event.preventDefault(); if (classroomId) void onSubmit(classroomId); }}><label htmlFor="assignment-classroom" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Active classroom</label><select id="assignment-classroom" required value={classroomId} onChange={(event) => setClassroomId(event.target.value)} className={INPUT}><option value="">Select a classroom</option>{choices.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.school_name} · {classroom.name}{classroom.id === device.classroom_id ? " (current)" : ""}</option>)}</select>{choices.length === 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">No active authorized classrooms are available.</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button><button type="submit" disabled={pending || !classroomId || classroomId === device.classroom_id} className="min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : device.classroom_id ? "Reassign device" : "Assign device"}</button></div></form>;
}

type Confirmation = { kind: "unassign" | "disable" | "rotate"; device: EdgeDevice };

export default function DeviceManagement() {
  const user = useCurrentUser();
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "disabled">("all");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [showRegister, setShowRegister] = useState(false);
  const [editing, setEditing] = useState<EdgeDevice | null>(null);
  const [assigning, setAssigning] = useState<EdgeDevice | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [secret, setSecret] = useState<{ result: DeviceRegistrationResult; operation: "registered" | "rotated" } | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextDevices, nextClassrooms] = await Promise.all([getDevices(), getClassrooms()]);
      setDevices(nextDevices);
      setClassrooms(nextClassrooms);
      setError(null);
      setErrorStatus(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Edge devices are unavailable.");
      setErrorStatus(caught instanceof ApiError ? caught.status : null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const schools = useMemo(() => schoolSummariesFromResources(classrooms, devices), [classrooms, devices]);
  const visibleDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return devices.filter((device) => {
      if (classroomFilter && device.classroom_id !== classroomFilter) return false;
      if (activeFilter === "active" && !device.is_active) return false;
      if (activeFilter === "disabled" && device.is_active) return false;
      if (assignmentFilter !== "all" && device.assignment_state !== assignmentFilter) return false;
      return !query || [device.display_name, device.device_code, device.school_name ?? "", device.classroom_name ?? ""].some((value) => value.toLowerCase().includes(query));
    });
  }, [activeFilter, assignmentFilter, classroomFilter, devices, search]);

  const handleRegister = async (input: { device_code: string; display_name: string; school_id: string; classroom_id?: string }) => {
    setPending(true);
    try {
      const result = await registerDevice(input);
      setShowRegister(false);
      setSecret({ result, operation: "registered" });
      toast.success("Device registered.");
      await load();
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to register device."); }
    finally { setPending(false); }
  };

  const handleEdit = async (name: string) => {
    if (!editing) return;
    setPending(true);
    try { await updateDevice(editing.id, { display_name: name }); setEditing(null); toast.success("Device updated."); await load(); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to update device."); }
    finally { setPending(false); }
  };

  const handleAssign = async (classroomId: string) => {
    if (!assigning) return;
    setPending(true);
    try {
      const classroom = classrooms.find((item) => item.id === classroomId);
      await assignDevice(assigning.id, { classroom_id: classroomId, ...(assigning.classroom_id ? { expected_current_classroom_id: assigning.classroom_id } : {}) });
      setAssigning(null);
      toast.success(`Device assigned${classroom ? ` to ${classroom.name}` : ""}.`);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        toast.error("This device assignment changed. Refresh and try again.");
        setAssigning(null);
        await load();
      } else toast.error(caught instanceof Error ? caught.message : "Unable to assign device.");
    } finally { setPending(false); }
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const { kind, device } = confirmation;
    setPending(true);
    try {
      if (kind === "unassign") { await unassignDevice(device.id); toast.success("Device unassigned."); }
      if (kind === "disable") { await disableDevice(device.id); toast.success("Device disabled."); }
      if (kind === "rotate") { const result = await rotateDeviceKey(device.id); setSecret({ result, operation: "rotated" }); toast.success("Device key rotated."); }
      setConfirmation(null);
      await load();
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to update device."); }
    finally { setPending(false); }
  };

  const handleEnable = async (device: EdgeDevice) => {
    setPending(true);
    try { await enableDevice(device.id); toast.success("Device enabled."); await load(); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to enable device."); }
    finally { setPending(false); }
  };

  return <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Multi-Room Management</p><h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Edge Devices</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Manage Raspberry Pi and EchoSense Edge devices.</p></div>{user?.role === "admin" && <button type="button" onClick={() => setShowRegister(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"><Plus className="h-4 w-4" aria-hidden="true" /> Register device</button>}</header>

    <section aria-label="Device filters" className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-800 dark:bg-slate-900"><div><label htmlFor="device-search" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Search</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="device-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, code, or school" className={`${INPUT} pl-10`} /></div></div><div><label htmlFor="device-classroom-filter" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Classroom</label><select id="device-classroom-filter" value={classroomFilter} onChange={(event) => setClassroomFilter(event.target.value)} className={INPUT}><option value="">All classrooms</option>{classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}</select></div><div><label htmlFor="device-status-filter" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Status</label><select id="device-status-filter" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)} className={INPUT}><option value="all">All statuses</option><option value="active">Active</option><option value="disabled">Disabled</option></select></div><div><label htmlFor="device-assignment-filter" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">Assignment</label><select id="device-assignment-filter" value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value as typeof assignmentFilter)} className={INPUT}><option value="all">All assignments</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option></select></div></section>

    {error && <ResourceError title="We couldn’t load Edge devices." message={error} status={errorStatus} onRetry={() => void load()} />}
    {loading && devices.length === 0 ? <div aria-label="Loading devices" className="grid gap-4 lg:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div> : !error && visibleDevices.length === 0 ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900"><Cpu className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{devices.length === 0 ? "No Edge devices registered." : "No Edge devices match these filters."}</h2>{devices.length === 0 && <button type="button" onClick={() => setShowRegister(true)} className="mt-4 min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Register device</button>}</section> : <div className="grid gap-4 lg:grid-cols-2">{visibleDevices.map((device) => <article key={device.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-bold text-slate-950 dark:text-white">{device.display_name}</h2><p className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">{device.device_code}</p></div><div className="flex flex-wrap gap-2"><StatusBadge active={device.is_active} inactiveLabel="Disabled" /><span className="inline-flex rounded-full border border-slate-300 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:text-slate-200">{device.assignment_state}</span></div></div><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-medium text-slate-500 dark:text-slate-400">School</dt><dd className="mt-1 text-slate-900 dark:text-white">{device.school_name ?? "School unavailable"}</dd></div><div><dt className="font-medium text-slate-500 dark:text-slate-400">Classroom</dt><dd className="mt-1 text-slate-900 dark:text-white">{device.classroom_name ?? "Unassigned"}</dd></div><div><dt className="font-medium text-slate-500 dark:text-slate-400">Last seen</dt><dd className="mt-1 text-slate-900 dark:text-white">{device.last_seen_at ? formatTimestamp(device.last_seen_at) : "Never"}</dd></div><div><dt className="font-medium text-slate-500 dark:text-slate-400">Assigned at</dt><dd className="mt-1 text-slate-900 dark:text-white">{device.assigned_at ? formatTimestamp(device.assigned_at) : "Not assigned"}</dd></div></dl><div className="mt-5 flex flex-wrap gap-2"><Link href={`/devices/${device.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">View</Link><button type="button" onClick={() => setEditing(device)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"><Pencil className="h-4 w-4" aria-hidden="true" /> Edit</button><button type="button" onClick={() => setAssigning(device)} className="min-h-11 rounded-xl border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-200">{device.classroom_id ? "Reassign" : "Assign"}</button>{device.classroom_id && <button type="button" onClick={() => setConfirmation({ kind: "unassign", device })} className="min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Unassign</button>}{device.is_active ? <button type="button" onClick={() => setConfirmation({ kind: "disable", device })} className="min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300">Disable</button> : <button type="button" disabled={pending} onClick={() => void handleEnable(device)} className="min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300">Enable</button>}<button type="button" onClick={() => setConfirmation({ kind: "rotate", device })} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 dark:text-amber-200"><KeyRound className="h-4 w-4" aria-hidden="true" /> Rotate key</button></div></article>)}</div>}

    {showRegister && <AccessibleDialog title="Register Edge device" description="Register now as unassigned or assign it to an active classroom." onClose={() => setShowRegister(false)} closeDisabled={pending} size="large"><RegisterDeviceForm schoolId={user?.school_id ?? null} isSuperAdmin={user?.is_super_admin === true} schools={schools} classrooms={classrooms} pending={pending} onCancel={() => setShowRegister(false)} onSubmit={handleRegister} /></AccessibleDialog>}
    {editing && <AccessibleDialog title={`Edit ${editing.display_name}`} description="Update safe device metadata. Classroom assignment is managed separately." onClose={() => setEditing(null)} closeDisabled={pending}><EditDeviceForm device={editing} pending={pending} onCancel={() => setEditing(null)} onSubmit={handleEdit} /></AccessibleDialog>}
    {assigning && <AccessibleDialog title={`${assigning.classroom_id ? "Reassign" : "Assign"} ${assigning.display_name}`} description={assigning.classroom_id ? `Currently assigned to ${assigning.classroom_name ?? "a classroom"}. Assignment changes use conflict protection.` : "Choose an active classroom in an authorized school."} onClose={() => setAssigning(null)} closeDisabled={pending}><AssignmentForm device={assigning} classrooms={classrooms} isSuperAdmin={user?.is_super_admin === true} pending={pending} onCancel={() => setAssigning(null)} onSubmit={handleAssign} /></AccessibleDialog>}
    {confirmation && <ConfirmDialog title={confirmation.kind === "unassign" ? `Unassign ${confirmation.device.display_name} from ${confirmation.device.classroom_name ?? "its classroom"}?` : confirmation.kind === "disable" ? `Disable ${confirmation.device.display_name}?` : "Rotate device key?"} description={confirmation.kind === "unassign" ? "The device will remain owned by its school and will not be deleted." : confirmation.kind === "disable" ? "Disabled devices cannot authenticate or send new alerts." : "The current key will stop working immediately. You must update the EchoSense Edge device with the new key."} confirmLabel={confirmation.kind === "unassign" ? "Unassign device" : confirmation.kind === "disable" ? "Disable device" : "Rotate key"} pending={pending} tone={confirmation.kind === "unassign" ? "primary" : "danger"} onCancel={() => setConfirmation(null)} onConfirm={() => void confirmAction()} />}
    {secret && <DeviceSecretDialog result={secret.result} operation={secret.operation} onClose={() => setSecret(null)} />}
  </div>;
}
