"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building2,
  Info,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import {
  ApiError,
  createUser,
  deleteUser,
  getUsers,
} from "@/lib/api";
import { isSuperAdmin } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import {
  buildNewUserPayload,
  selectableSchools,
  userCreateErrorMessage,
  type NewUserRole,
} from "@/lib/user-admin";
import { useSchools } from "@/lib/useSchools";
import type { User } from "@/lib/types";

const ROLE_LABELS: Record<User["role"], string> = {
  admin: "Administrator",
  staff: "Teacher / Staff",
  counselor: "Guidance Counselor",
};

const INPUT =
  "min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink       ";

function roleLabel(user: User): string {
  return isSuperAdmin(user) ? "Super Administrator" : ROLE_LABELS[user.role];
}

export default function UsersPage() {
  const currentUser = useCurrentUser();
  const creatorIsSuperAdmin = isSuperAdmin(currentUser);
  const showSchoolFilter = false;
  const { schools } = useSchools(creatorIsSuperAdmin);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<NewUserRole>("staff");
  const [schoolId, setSchoolId] = useState("");
  const [newSuperAdmin, setNewSuperAdmin] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const schoolNames = useMemo(
    () => new Map(schools.map((school) => [school.id, school.name])),
    [schools]
  );
  // GET /users has no school filter, so the super-admin filter runs on the loaded list.
  const visibleUsers = useMemo(
    () =>
      showSchoolFilter && schoolFilter
        ? users.filter((user) =>
            schoolFilter === "none" ? !user.school_id : user.school_id === schoolFilter
          )
        : users,
    [schoolFilter, showSchoolFilter, users]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setUsers(await getUsers());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const openCreateDialog = () => {
    setEmail("");
    setPassword("");
    setRole("staff");
    setSchoolId(showSchoolFilter && schoolFilter !== "none" ? schoolFilter : "");
    setNewSuperAdmin(false);
    setFormError("");
    setShowCreate(true);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const built = buildNewUserPayload(
      { email, password, role, schoolId, superAdmin: newSuperAdmin },
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
      toast.success("User account created. They must change the password on first sign-in.");
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? userCreateErrorMessage(err.status, err.message)
          : "We couldn’t create the user account."
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
      setUsers((current) =>
        current.filter((user) => user.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      toast.success("User account deleted.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("You don’t have permission to delete this account.");
      } else {
        toast.error("We couldn’t delete the user account.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const creatingSuperAdmin = creatorIsSuperAdmin && newSuperAdmin && role === "admin";

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          Administrator
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
              User Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {creatorIsSuperAdmin
                ? "View accounts in every school, create accounts for a chosen school, and remove accounts."
                : "View the accounts in your school, create new ones, and remove accounts."}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add User
          </button>
        </div>
      </header>

      {showSchoolFilter && (
        <div className="mb-5 max-w-xs">
          <label
            htmlFor="users-school-filter"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            School
          </label>
          <select
            id="users-school-filter"
            value={schoolFilter}
            onChange={(event) => setSchoolFilter(event.target.value)}
            className={INPUT}
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
                {school.is_active ? "" : " (inactive)"}
              </option>
            ))}
            <option value="none">No school (super administrators)</option>
          </select>
        </div>
      )}

      {loading ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2">
          <span className="sr-only">Loading user accounts</span>
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-panel border border-line bg-bg"
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-panel border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h2 className="font-semibold text-ink">
            We couldn&apos;t load user accounts.
          </h2>
          <p className="mt-2 text-sm text-danger">
            Please check the connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : visibleUsers.length === 0 ? (
        <div className="rounded-panel border border-line bg-bg p-8 text-center">
          <Users className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-ink">
            No user accounts are available.
          </h2>
        </div>
      ) : (
        <section aria-label="User accounts">
          <p className="mb-3 text-sm text-muted">
            {visibleUsers.length} account{visibleUsers.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-panel border border-line bg-bg p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-control bg-surface p-2.5 text-link">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {user.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(user)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                      aria-label={`Delete ${user.email}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Email
                    </dt>
                    <dd className="mt-1 break-words font-semibold text-ink">
                      {user.email}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs font-medium text-link">
                          You
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Access level
                    </dt>
                    <dd className="mt-1 text-sm text-ink">
                      {roleLabel(user)}
                    </dd>
                  </div>
                  {showSchoolFilter && (
                    <div>
                      <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                        School
                      </dt>
                      <dd className="mt-1 text-sm text-ink">
                        {user.school_id
                          ? schoolNames.get(user.school_id) ?? "Unknown school"
                          : "No school"}
                      </dd>
                    </div>
                  )}
                </dl>
                {user.must_change_password && (
                  <p className="mt-4 flex items-center gap-2 rounded-control bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Temporary password: not changed yet
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {showCreate && (
        <AccessibleDialog
          title="Add User Account"
          description={
            creatorIsSuperAdmin
              ? "Create an account for a school, or another super administrator."
              : "Create an account in your school."
          }
          onClose={() => setShowCreate(false)}
          closeDisabled={submitting}
        >
          <form onSubmit={(event) => void handleCreate(event)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="new-user-email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Email
              </label>
              <input
                id="new-user-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor="new-user-password"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Temporary password
              </label>
              <input
                id="new-user-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                aria-describedby="new-user-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT}
              />
              <p
                id="new-user-password-hint"
                className="mt-1.5 flex items-start gap-1.5 text-xs text-muted"
              >
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                At least 8 characters. User must change this password on first login.
              </p>
            </div>
            <div>
              <label
                htmlFor="new-user-role"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Access level
              </label>
              <select
                id="new-user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as NewUserRole)}
                className={INPUT}
              >
                <option value="staff">Teacher / Staff</option>
                <option value="counselor">Guidance Counselor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            {creatorIsSuperAdmin && role === "admin" && (
              <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={newSuperAdmin}
                  onChange={(event) => setNewSuperAdmin(event.target.checked)}
                  className="h-5 w-5 rounded border-line-strong"
                />
                Super administrator (all schools, no school assigned)
              </label>
            )}
            {creatorIsSuperAdmin && !creatingSuperAdmin && (
              <div>
                <label
                  htmlFor="new-user-school"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  School
                </label>
                <select
                  id="new-user-school"
                  required
                  value={schoolId}
                  onChange={(event) => setSchoolId(event.target.value)}
                  className={INPUT}
                >
                  <option value="">Select a school</option>
                  {selectableSchools(schools).map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!creatorIsSuperAdmin && (
              <p className="text-sm text-muted">
                The account is created in your school.
              </p>
            )}
            {formError && (
              <p
                role="alert"
                className="flex items-start gap-2 text-sm font-medium text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
                className="min-h-11 rounded-control border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:opacity-60"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {submitting ? "Creating…" : "Create Account"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}

      {deleteTarget && (
        <AccessibleDialog
          title="Delete User Account"
          description={`Delete ${deleteTarget.email}? This action cannot be undone.`}
          onClose={() => setDeleteTarget(null)}
          closeDisabled={deleting}
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="min-h-11 rounded-control border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              aria-busy={deleting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {deleting ? "Deleting…" : "Delete Account"}
            </button>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
}
