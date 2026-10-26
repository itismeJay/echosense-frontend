"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, UserPlus, Users } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  LoadingRows,
  Page,
  PageHeader,
  hintClass,
  inputClass,
  selectClass,
} from "@/components/ui";
import { ApiError, createUser, deleteUser, getUsers } from "@/lib/api";
import { isSuperAdmin } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { useSchoolScope } from "@/lib/school-scope";
import { buildNewUserPayload, userCreateErrorMessage, type NewUserRole } from "@/lib/user-admin";
import type { User } from "@/lib/types";

const ROLE_LABELS: Record<User["role"], string> = {
  admin: "School administrator",
  staff: "Teacher",
  counselor: "Guidance counselor",
};

function roleLabel(user: User): string {
  return isSuperAdmin(user) ? "Platform administrator" : ROLE_LABELS[user.role];
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
  const [newSuperAdmin, setNewSuperAdmin] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setError(false);
    try {
      setUsers(await getUsers());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(), 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const openCreate = () => {
    setEmail("");
    setPassword("");
    setRole("staff");
    setNewSuperAdmin(false);
    setFormError("");
    setShowCreate(true);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const built = buildNewUserPayload(
      // Inside a school, a super admin creates accounts for that school.
      { email, password, role, schoolId: scope?.id ?? "", superAdmin: newSuperAdmin },
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
                <th scope="col" className="hidden px-4 py-2.5 font-normal sm:table-cell">Status</th>
                <th scope="col" className="px-4 py-2.5 font-normal"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((user) => {
                const isMe = currentUser?.id === user.id;
                return (
                  <tr key={user.id}>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-ink">
                      {user.email}
                      {isMe && <span className="ml-2 text-small text-muted">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-ink">{roleLabel(user)}</td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {user.must_change_password ? "Hasn't signed in yet" : "Active"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          aria-label={`Remove ${user.email}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
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
                <option value="staff">Teacher: sees Overview and Alerts</option>
                <option value="counselor">Guidance counselor: also sees Reports</option>
                <option value="admin">School administrator: manages the school</option>
              </select>
            </Field>
            {creatorIsSuperAdmin && role === "admin" && (
              <label className="flex min-h-11 items-start gap-3 text-body text-ink">
                <input
                  type="checkbox"
                  checked={newSuperAdmin}
                  onChange={(event) => setNewSuperAdmin(event.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-line-strong"
                />
                <span>
                  Platform administrator
                  <span className={`block ${hintClass} mt-0`}>Manages every school instead of this one.</span>
                </span>
              </label>
            )}
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
