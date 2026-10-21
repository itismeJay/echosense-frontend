// Rules and messages for creating accounts, mirroring the backend's
// resolve_new_user_scope and RegisterRequest (see the ORG_STEP3 API change list).
import type { School } from "./types";

export type NewUserRole = "admin" | "staff" | "counselor";

export interface NewUserForm {
  email: string;
  password: string;
  role: NewUserRole;
  schoolId: string;
  superAdmin: boolean;
}

export interface NewUserPayload {
  email: string;
  password: string;
  role: NewUserRole;
  school_id?: string;
  is_super_admin?: boolean;
}

/**
 * Builds the POST /users/ body. A school admin never sends school_id: the backend
 * fills in their own school. A super admin must pick a school unless the new account
 * is itself a super admin.
 */
export function buildNewUserPayload(
  form: NewUserForm,
  creatorIsSuperAdmin: boolean
): { payload: NewUserPayload } | { error: string } {
  const email = form.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s.]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (form.password.length < 8) {
    return { error: "The temporary password must be at least 8 characters." };
  }
  if (new TextEncoder().encode(form.password).length > 72) {
    return { error: "The temporary password must be at most 72 bytes." };
  }
  if (!creatorIsSuperAdmin) {
    return { payload: { email, password: form.password, role: form.role } };
  }
  const superAdmin = form.superAdmin && form.role === "admin";
  if (superAdmin) {
    return {
      payload: { email, password: form.password, role: "admin", is_super_admin: true },
    };
  }
  if (!form.schoolId) return { error: "Choose the school for this account." };
  return {
    payload: { email, password: form.password, role: form.role, school_id: form.schoolId },
  };
}

export function selectableSchools(schools: School[]): School[] {
  return schools.filter((school) => school.is_active);
}

/** Maps POST /users/ failures (status + backend detail) to text the admin can act on. */
export function userCreateErrorMessage(status: number, detail: string): string {
  if (status === 409 && detail === "School is inactive") {
    return "This school is inactive. Activate it on the Schools page before adding users.";
  }
  if (status === 409) return "That email address is already registered.";
  if (status === 404) return "The selected school no longer exists. Refresh and try again.";
  if (status === 403 && detail === "Administrator is not assigned to a school") {
    return "Your account is not assigned to a school, so it cannot create users.";
  }
  if (status === 403) return "You don’t have permission to create this account.";
  if (status === 422) {
    if (/password must be at least 8/.test(detail)) {
      return "The temporary password must be at least 8 characters.";
    }
    if (/school_id is required/.test(detail)) return "Choose the school for this account.";
    if (/email/.test(detail)) return "Enter a valid email address.";
    return "Please check the information you entered.";
  }
  return "We couldn’t create the user account.";
}
