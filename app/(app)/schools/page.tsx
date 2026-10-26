"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import Menu from "@/components/ui/Menu";
import { Button, EmptyState, ErrorState, Field, FormError, LoadingRows, Page, PageHeader, inputClass } from "@/components/ui";
import { ApiError, createSchool, getSchoolSummaries, updateSchool } from "@/lib/api";
import { clearSchoolScope, enterSchool } from "@/lib/school-scope";
import type { SchoolSummaryCard } from "@/lib/types";

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function SchoolNameDialog({
  school,
  onClose,
  onSaved,
}: {
  school: SchoolSummaryCard | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(school?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setError("Enter the school's name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (school) await updateSchool(school.id, { name: trimmed });
      else await createSchool(trimmed);
      toast.success(school ? "School renamed" : `${trimmed} added`);
      await onSaved();
      onClose();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 409
          ? "Another school already has this name."
          : caught instanceof Error
            ? caught.message
            : "The school was not saved. Try again."
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AccessibleDialog
      title={school ? "Rename school" : "Add school"}
      description={school ? undefined : "Use the school's official name. You can add classrooms and people after you enter it."}
      onClose={onClose}
      closeDisabled={pending}
    >
      <form onSubmit={(event) => void submit(event)} noValidate>
        <Field id="school-name" label="School name">
          <input
            id="school-name"
            autoFocus
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(error)}
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
            {school ? "Save name" : "Add school"}
          </Button>
        </div>
      </form>
    </AccessibleDialog>
  );
}

function Stat({ value, label, emphasis = false }: { value: number | string; label: string; emphasis?: boolean }) {
  return (
    <div>
      <dt className="text-small text-muted">{label}</dt>
      <dd className={`num text-title ${emphasis ? "font-semibold text-ink" : "font-medium text-ink"}`}>{value}</dd>
    </div>
  );
}

export default function AllSchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolSummaryCard[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<SchoolSummaryCard | null | "new">(null);
  const [toggling, setToggling] = useState<SchoolSummaryCard | null>(null);
  const [togglePending, setTogglePending] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setSchools(await getSchoolSummaries());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    // All schools is platform mode: leave any school the super admin was viewing.
    clearSchoolScope();
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const enter = (school: SchoolSummaryCard) => {
    enterSchool({ id: school.id, name: school.name });
    router.push("/overview");
  };

  const toggleActive = async () => {
    if (!toggling) return;
    setTogglePending(true);
    try {
      await updateSchool(toggling.id, { is_active: !toggling.is_active });
      toast.success(toggling.is_active ? `${toggling.name} turned off` : `${toggling.name} turned on`);
      setToggling(null);
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? `${caught.message} Nothing was changed.` : "Nothing was changed.");
    } finally {
      setTogglePending(false);
    }
  };

  const sorted = [...(schools ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name));

  return (
    <Page>
      <PageHeader
        title="All schools"
        description="Each school's alerts, devices and people. Enter a school to work inside it."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing("new")}>
            Add school
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Schools couldn't be loaded" onRetry={() => void load()}>
          Check the internet connection, then try again.
        </ErrorState>
      ) : !schools ? (
        <div className="rounded-panel border border-line">
          <LoadingRows rows={2} label="Loading schools" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-panel border border-line">
          <EmptyState
            title="No schools yet"
            icon={Building2}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setEditing("new")}>
                Add school
              </Button>
            }
          >
            Add the first school, then enter it to add classrooms, devices and people.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {sorted.map((school) => (
            <li key={school.id} className="flex flex-col rounded-panel border border-line bg-bg p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-title font-semibold text-ink">{school.name}</h2>
                  <p className={`mt-0.5 text-small ${school.is_active ? "text-muted" : "font-medium text-ink"}`}>
                    {school.is_active ? "Active" : "Turned off. Its people can't sign in."}
                  </p>
                </div>
                <Menu
                  label={`Manage ${school.name}`}
                  triggerClassName="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-strong px-3 text-body font-medium text-ink hover:bg-surface"
                  trigger={
                    <>
                      Manage
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </>
                  }
                  items={[
                    {
                      kind: "action",
                      label: "Rename",
                      onSelect: () => setEditing(school),
                      icon: <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />,
                    },
                    {
                      kind: "action",
                      label: school.is_active ? "Turn off school" : "Turn on school",
                      danger: school.is_active,
                      onSelect: () => setToggling(school),
                      icon: <Power className="h-4 w-4" aria-hidden="true" />,
                    },
                  ]}
                />
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
                <Stat value={school.alerts_needing_review} label="Need review" emphasis={school.alerts_needing_review > 0} />
                <Stat value={school.high_today} label="High today" emphasis={school.high_today > 0} />
                <Stat value={school.alerts_this_week} label="This week" />
              </dl>
              <dl className="mt-4 grid gap-1 text-body">
                <div className="flex gap-2">
                  <dt className="text-muted">Devices online</dt>
                  <dd className="num text-ink">
                    {school.devices_total === 0 ? "No devices yet" : `${school.devices_online} of ${school.devices_total}`}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted">People</dt>
                  <dd className="num text-ink">
                    {plural(school.users.admin, "admin", "admins")}, {plural(school.users.counselor, "counselor", "counselors")},{" "}
                    {plural(school.users.staff, "teacher", "teachers")}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex justify-end">
                <Button variant="primary" onClick={() => enter(school)} aria-label={`Enter ${school.name}`}>
                  Enter school
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <SchoolNameDialog school={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
      {toggling && (
        <ConfirmDialog
          title={toggling.is_active ? `Turn off ${toggling.name}?` : `Turn on ${toggling.name}?`}
          description={
            toggling.is_active
              ? "Its people are signed out and can't sign in, and its devices stop sending alerts. Nothing is deleted."
              : "Its people can sign in again and its devices can send alerts."
          }
          confirmLabel={toggling.is_active ? "Turn off school" : "Turn on school"}
          tone={toggling.is_active ? "danger" : "primary"}
          pending={togglePending}
          onCancel={() => setToggling(null)}
          onConfirm={() => void toggleActive()}
        />
      )}
    </Page>
  );
}
