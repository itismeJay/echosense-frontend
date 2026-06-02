"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { UserPlus, X, Loader2, Users, WifiOff, Trash2, Pencil } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { getUsers, registerUser, deleteUser, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";
const INPUT = "w-full px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors";

const TOAST_SUCCESS = { style: { background: "#1a1a2e", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px" } };
const TOAST_ERROR   = { style: { background: "#1a1a2e", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px" } };

const ROLE_BADGE: Record<string, string> = {
  admin:     "bg-indigo-500/10 text-indigo-500    dark:text-indigo-400    border border-indigo-500/20",
  staff:     "bg-violet-500/10 text-violet-500    dark:text-violet-400    border border-violet-500/20",
  counselor: "bg-cyan-500/10   text-cyan-600      dark:text-cyan-400      border border-cyan-500/20",
};

export default function UsersPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  const [users, setUsers]           = useState<User[]>([]);
  const [fetching, setFetching]     = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [showModal, setShowModal]   = useState(false);
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [role, setRole]             = useState<"admin" | "staff" | "counselor">("staff");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editEmail, setEditEmail]   = useState("");
  const [editRole, setEditRole]     = useState<"admin" | "staff" | "counselor">("staff");

  // Redirect non-admins — middleware already blocks unauthenticated users
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    setFetchError(false);
    try {
      setUsers(await getUsers());
    } catch {
      setFetchError(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchUsers(), 0);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const openModal = () => {
    setEmail("");
    setPassword("");
    setRole("staff");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const openEditModal = (user: User) => {
    setEditTarget(user);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const closeEditModal = () => setEditTarget(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("Permission denied", TOAST_ERROR);
      } else {
        toast.error("Failed to delete user", TOAST_ERROR);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerUser({ email, password, role });
      closeModal();
      await fetchUsers();
      toast.success("User created successfully", TOAST_SUCCESS);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) toast.error("Email already registered", TOAST_ERROR);
        else if (err.status === 403) toast.error("Permission denied", TOAST_ERROR);
        else toast.error("Failed to create user", TOAST_ERROR);
      } else {
        toast.error("Failed to create user", TOAST_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    setEditTarget(null);
    toast.success("User updated", TOAST_SUCCESS);
  };

  // Don't render page content for non-admins while redirect fires
  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Manage system users and their roles</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New User</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Table card */}
      <div className={CARD}>
        {fetching ? (
          <div className="p-2">
            <div className="animate-pulse">
              <div className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/10">
                {["w-24", "w-48", "w-16"].map((w, i) => (
                  <div key={i} className={`h-3 ${w} bg-gray-200 dark:bg-white/10 rounded-full`} />
                ))}
              </div>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-50 dark:border-white/5">
                  <div className="h-3 w-32 bg-gray-100 dark:bg-white/5 rounded-full" />
                  <div className="h-3 w-48 bg-gray-100 dark:bg-white/5 rounded-full" />
                  <div className="h-5 w-14 bg-gray-100 dark:bg-white/5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-3 rounded-2xl bg-gray-500/10 border border-gray-500/20">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Failed to load users</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check your connection and try again</p>
            </div>
            <button
              onClick={() => void fetchUsers()}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Role</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400 dark:text-gray-500 text-xs font-mono truncate max-w-[120px]">
                        {u.id}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-sm">
                        {u.email}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-indigo-400">(you)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_BADGE[u.role] ?? ROLE_BADGE.user}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            aria-label={`Edit ${u.email}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              aria-label={`Delete ${u.email}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update User Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeEditModal}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-2xl p-6"
          >
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Update User</h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "admin" | "staff" | "counselor")}
                  className={INPUT}
                >
                  <option value="staff">staff</option>
                  <option value="counselor">counselor</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20"
                >
                  <Pencil className="w-4 h-4" />
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-sm bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete user</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 break-all">
                  {deleteTarget.email}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-2xl p-6"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Add New User</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "staff" | "counselor")}
                  className={INPUT}
                >
                  <option value="staff">staff</option>
                  <option value="counselor">counselor</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
