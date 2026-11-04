// Rules and messages for creating accounts, mirroring the backend's
// resolve_new_user_scope and RegisterRequest (see the ORG_STEP3 API change list).
import type { School } from "./types";

export type NewUserRole = "admin" | "staff" | "counselor";

/** The Add person role choices, in the order the dialog lists them. */
export const NEW_USER_ROLE_OPTIONS: ReadonlyArray<{ value: NewUserRole; label: string }> = [
  { value: "admin", label: "School administrator: manages the school" },
  { value: "counselor", label: "Guidance counselor: reviews alerts and makes reports" },
  { value: "staff", label: "Teacher: gets alerts for their classroom" },
];

export interface NewUserForm {
  email: string;
  password: string;
  role: NewUserRole;
  /** The school a super admin has entered; empty for a school admin. */
  schoolId: string;
}

export interface NewUserPayload {
  email: string;
  password: string;
  role: NewUserRole;
  school_id?: string;
  is_super_admin: false;
}

/**
 * Builds the POST /users/ body. Add person only ever creates school accounts: the body
 * always says is_super_admin: false. A school admin never sends school_id (the backend
 * fills in their own school); a super admin creates accounts for the school they entered.
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
  if (!NEW_USER_ROLE_OPTIONS.some((option) => option.value === form.role)) {
    return { error: "Choose a role for this account." };
  }
  const base = { email, password: form.password, role: form.role, is_super_admin: false as const };
  if (!creatorIsSuperAdmin) return { payload: base };
  if (!form.schoolId) return { error: "Enter a school from All schools before adding people." };
  return { payload: { ...base, school_id: form.schoolId } };
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
    if (/school_id is required/.test(detail)) return "Enter a school from All schools before adding people.";
    if (/email/.test(detail)) return "Enter a valid email address.";
    return "Please check the information you entered.";
  }
  return "We couldn’t create the user account.";
}

// --- Rooms and password reset (People) ---------------------------------------------

interface PersonLike {
  id: string;
  role: NewUserRole;
  is_super_admin?: boolean;
  classroom_ids?: string[];
}

/** Only teachers have rooms: they see and are pushed only those rooms' alerts. */
export function canAssignRooms(person: PersonLike): boolean {
  return person.role === "staff" && !person.is_super_admin;
}

/**
 * Mirrors POST /users/{id}/reset-password: an administrator resets anyone in their school
 * except themselves (they use Change password) and a super admin.
 */
export function canResetPassword(
  actor: Pick<PersonLike, "id" | "role"> | null | undefined,
  person: PersonLike
): boolean {
  return Boolean(actor && actor.role === "admin" && actor.id !== person.id && !person.is_super_admin);
}

/** The teacher's room names, in classroom order, for the People list. */
export function roomNames(
  person: PersonLike,
  classrooms: ReadonlyArray<{ id: string; name: string }>
): string[] {
  const assigned = new Set(person.classroom_ids ?? []);
  return classrooms.filter((room) => assigned.has(room.id)).map((room) => room.name);
}

export function roomsErrorMessage(status: number): string {
  if (status === 403) return "Your account can't change this person's rooms.";
  if (status === 422) return "Pick classrooms of this school that are in use, then try again.";
  return "The rooms were not saved. Try again.";
}

export function resetPasswordErrorMessage(status: number): string {
  if (status === 403) return "Your account can't reset this person's password.";
  if (status === 404) return "This person no longer has an account. The list has been refreshed.";
  return "The password was not reset. Try again.";
}

/** Said to a teacher whose alert list is empty: they only see their own rooms. */
export const TEACHER_ROOMS_NOTE =
  "You see alerts only from the classrooms your school administrator gave you. If you expect alerts, ask them to check your rooms in People.";
