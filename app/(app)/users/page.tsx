"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
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
  deleteUser,
  getUsers,
  registerUser,
} from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/types";

const ROLE_LABELS: Record<User["role"], string> = {
  admin: "Administrator",
  staff: "Teacher / Staff",
  counselor: "Guidance Counselor",
};

const INPUT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export default function UsersPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

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
    setShowCreate(true);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await registerUser({ email, password, role });
      setShowCreate(false);
      await loadUsers();
      toast.success("User account created.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("That email address is already registered.");
      } else if (err instanceof ApiError && err.status === 403) {
        toast.error("You don’t have permission to create this account.");
      } else {
        toast.error("We couldn’t create the user account.");
      }
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

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Administrator
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
              User Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              View authorized users, assign roles when creating accounts, and
              remove accounts using the current account system.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add User
          </button>
        </div>
      </header>

      {loading ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2">
          <span className="sr-only">Loading user accounts</span>
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h2 className="font-bold text-red-950 dark:text-red-100">
            We couldn&apos;t load user accounts.
          </h2>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            Please check the connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto h-7 w-7 text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 font-bold text-slate-950 dark:text-white">
            No user accounts are available.
          </h2>
        </div>
      ) : (
        <section aria-label="User accounts">
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            {users.length} account{users.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {user.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(user)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                      aria-label={`Delete ${user.email}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Email
                    </dt>
                    <dd className="mt-1 break-words font-semibold text-slate-950 dark:text-white">
                      {user.email}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                          You
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Access level
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {ROLE_LABELS[user.role]}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {showCreate && (
        <AccessibleDialog
          title="Add User Account"
          description="Create an account for authorized school personnel."
          onClose={() => setShowCreate(false)}
          closeDisabled={submitting}
        >
          <form onSubmit={(event) => void handleCreate(event)} className="space-y-4">
            <div>
              <label
                htmlFor="new-user-email"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
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
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Temporary password
              </label>
              <input
                id="new-user-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor="new-user-role"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Access level
              </label>
              <select
                id="new-user-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as User["role"])
                }
                className={INPUT}
              >
                <option value="staff">Teacher / Staff</option>
                <option value="counselor">Guidance Counselor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
                className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-60"
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
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              aria-busy={deleting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700 disabled:opacity-60"
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
