"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DoorOpen, KeyRound, MoreHorizontal, Trash2, UserPlus, Users } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import AssignRoomsDialog from "@/components/people/AssignRoomsDialog";
import TemporaryPasswordDialog from "@/components/people/TemporaryPasswordDialog";
import Menu, { type MenuItem } from "@/components/ui/Menu";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  LoadingRows,
  Page,
  PageHeader,
  inputClass,
  selectClass,
} from "@/components/ui";
import {
  ApiError,
  createUser,
  deleteUser,
  getClassrooms,
  getUsers,
  resetUserPassword,
  setUserClassrooms,
} from "@/lib/api";
import { isSuperAdmin } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { useSchoolScope } from "@/lib/school-scope";
import {
  NEW_USER_ROLE_OPTIONS,
  buildNewUserPayload,
  canAssignRooms,
  canResetPassword,
  resetPasswordErrorMessage,
  roomNames,
  roomsErrorMessage,
  userCreateErrorMessage,
  type NewUserRole,
} from "@/lib/user-admin";
import type { Classroom, PasswordResetResult, User } from "@/lib/types";

const ROLE_LABELS: Record<User["role"], string> = {
  admin: "School administrator",
  staff: "Teacher",
  counselor: "Guidance counselor",
};

function roleLabel(user: User): string {
  return isSuperAdmin(user) ? "Platform administrator" : ROLE_LABELS[user.role];
}

/** What alerts this person sees: a teacher's rooms, or the whole school. */
function RoomsCell({ user, classrooms }: { user: User; classrooms: Classroom[] | null }) {
  if (isSuperAdmin(user)) return <span className="text-muted">Every school</span>;
  if (!canAssignRooms(user)) return <span className="text-muted">Whole school</span>;
  if (classrooms === null) return <span className="text-muted">Loading</span>;
  const names = roomNames(user, classrooms);
  return names.length ? (
    <span className="text-ink">{names.join(", ")}</span>
  ) : (
    <span className="text-muted">No room yet. Sees no alerts</span>
  );
}

export default function PeoplePage() {
  const currentUser = useCurrentUser();
  const scope = useSchoolScope();
  const creatorIsSuperAdmin = isSuperAdmin(currentUser);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<NewUserRole>("staff");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[] | null>(null);
  const [roomsTarget, setRoomsTarget] = useState<User | null>(null);
  const [roomsError, setRoomsError] = useState("");
  const [savingRooms, setSavingRooms] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<PasswordResetResult | null>(null);

  const loadUsers = useCallback(async () => {
    setError(false);
    const [people, rooms] = await Promise.allSettled([getUsers(), getClassrooms()]);
    if (people.status === "fulfilled") setUsers(people.value);
    else setError(true);
    // Without classrooms the list still works; teachers' rooms just can't be named.
    setClassrooms(rooms.status === "fulfilled" ? rooms.value : []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(), 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const openCreate = () => {
    setEmail("");
    setPassword("");
    setRole("staff");
    setFormError("");
    setShowCreate(true);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const built = buildNewUserPayload(
      // Inside a school, a super admin creates accounts for that school.
      { email, password, role, schoolId: scope?.id ?? "" },
      creatorIsSuperAdmin
    );
    if ("error" in built) {
      setFormError(built.error);
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await createUser(built.payload);
      setShowCreate(false);
      await loadUsers();
      toast.success("Account added. They'll choose a new password the first time they sign in.");
    } catch (caught) {
      setFormError(
        caught instanceof ApiError ? userCreateErrorMessage(caught.status, caught.message) : "The account was not added. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((current) => current?.filter((user) => user.id !== deleteTarget.id) ?? null);
      setDeleteTarget(null);
      toast.success("Account removed");
    } catch (caught) {
      toast.error(
        caught instanceof ApiError && caught.status === 403
          ? "Your account can't remove this person."
          : "The account was not removed. Try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const saveRooms = async (classroomIds: string[]) => {
    if (!roomsTarget) return;
    setSavingRooms(true);
    setRoomsError("");
    try {
      const updated = await setUserClassrooms(roomsTarget.id, classroomIds);
      setUsers((current) => current?.map((user) => (user.id === updated.id ? { ...user, ...updated } : user)) ?? null);
      setRoomsTarget(null);
      toast.success(classroomIds.length ? "Rooms saved" : "Rooms removed. They see no alerts now.");
    } catch (caught) {
      setRoomsError(caught instanceof ApiError ? roomsErrorMessage(caught.status) : "The rooms were not saved. Try again.");
    } finally {
      setSavingRooms(false);
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const result = await resetUserPassword(resetTarget.id);
      setUsers((current) => current?.map((user) => (user.id === result.user.id ? { ...user, ...result.user } : user)) ?? null);
      setResetTarget(null);
      setResetResult(result);
    } catch (caught) {
      const status = caught instanceof ApiError ? caught.status : 0;
      toast.error(resetPasswordErrorMessage(status));
      setResetTarget(null);
      if (status === 404) await loadUsers();
    } finally {
      setResetting(false);
    }
  };

  const actionsFor = (user: User): MenuItem[] => {
    const items: MenuItem[] = [];
    if (canAssignRooms(user)) {
      items.push({
        kind: "action",
        label: "Rooms",
        onSelect: () => {
          setRoomsError("");
          setRoomsTarget(user);
        },
        icon: <DoorOpen className="h-4 w-4 text-muted" aria-hidden="true" />,
      });
    }
    if (canResetPassword(currentUser, user)) {
      items.push({
        kind: "action",
        label: "Reset password",
        onSelect: () => setResetTarget(user),
        icon: <KeyRound className="h-4 w-4 text-muted" aria-hidden="true" />,
      });
    }
    if (currentUser?.id !== user.id) {
      items.push({
        kind: "action",
        label: "Remove account",
        danger: true,
        onSelect: () => setDeleteTarget(user),
        icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
      });
    }
    return items;
  };

  const sorted = [...(users ?? [])].sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));

  return (
    <Page>
      <PageHeader
        title="People"
        description="Who can sign in to EchoSense for this school, and what they can see."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={openCreate}>
            Add person
          </Button>
        }
      />

      {error ? (
        <ErrorState title="The list of people couldn't be loaded" onRetry={() => void loadUsers()}>
          Check the internet connection, then try again.
        </ErrorState>
      ) : users === null ? (
        <div className="rounded-panel border border-line">
          <LoadingRows rows={3} label="Loading people" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-panel border border-line">
          <EmptyState
            title="No one has an account yet"
            icon={Users}
            action={
              <Button variant="primary" icon={UserPlus} onClick={openCreate}>
                Add person
              </Button>
            }
          >
            Add teachers, counselors and administrators so they can review alerts.
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line">
          <table className="w-full text-left text-body">
            <thead className="border-b border-line text-small text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-normal">Email</th>
                <th scope="col" className="px-4 py-2.5 font-normal">Role</th>
                <th scope="col" className="hidden px-4 py-2.5 font-normal md:table-cell">Sees alerts from</th>
                <th scope="col" className="hidden px-4 py-2.5 font-normal sm:table-cell">Status</th>
                <th scope="col" className="px-4 py-2.5 font-normal"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((user) => {
                const isMe = currentUser?.id === user.id;
                const actions = actionsFor(user);
                return (
                  <tr key={user.id}>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-ink">
                      {user.email}
                      {isMe && <span className="ml-2 text-small text-muted">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-ink">{roleLabel(user)}</td>
                    <td className="hidden max-w-[16rem] px-4 py-3 md:table-cell">
                      <RoomsCell user={user} classrooms={classrooms} />
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {user.must_change_password ? "Hasn't signed in yet" : "Active"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {actions.length > 0 && (
                        <Menu
                          label={`Manage ${user.email}`}
                          triggerClassName="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-surface hover:text-ink"
                          trigger={<MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
                          items={actions}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <AccessibleDialog
          title="Add person"
          description={
            scope ? `They will have an account at ${scope.name}.` : "They will have an account at your school."
          }
          onClose={() => setShowCreate(false)}
          closeDisabled={submitting}
        >
          <form onSubmit={(event) => void handleCreate(event)} noValidate className="grid gap-4">
            <Field id="new-user-email" label="Email">
              <input
                id="new-user-email"
                type="email"
                autoComplete="off"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              id="new-user-password"
              label="Temporary password"
              hint="At least 8 characters. They choose their own the first time they sign in."
            >
              <input
                id="new-user-password"
                type="text"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="new-user-password-hint"
                className={inputClass}
              />
            </Field>
            <Field id="new-user-role" label="Role">
              <select
                id="new-user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as NewUserRole)}
                className={selectClass}
              >
                {NEW_USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            {formError && <FormError>{formError}</FormError>}
            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setShowCreate(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" pending={submitting}>
                Add person
              </Button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {roomsTarget && (
        <AssignRoomsDialog
          person={roomsTarget}
          classrooms={classrooms ?? []}
          pending={savingRooms}
          error={roomsError}
          onCancel={() => setRoomsTarget(null)}
          onSubmit={(ids) => void saveRooms(ids)}
        />
      )}

      {resetTarget && (
        <ConfirmDialog
          title={`Reset the password for ${resetTarget.email}?`}
          description="Their current password stops working. You get a temporary password to give them, and they choose their own when they sign in."
          confirmLabel="Reset password"
          tone="primary"
          pending={resetting}
          onCancel={() => setResetTarget(null)}
          onConfirm={() => void handleReset()}
        />
      )}

      {resetResult && <TemporaryPasswordDialog result={resetResult} onClose={() => setResetResult(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          title={`Remove ${deleteTarget.email}?`}
          description="They won't be able to sign in any more. Alerts they reviewed stay in the history."
          confirmLabel="Remove account"
          pending={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </Page>
  );
}
