// Backend account-state 403 codes (see the backend's ORG_STEP3 API change list).
export const PASSWORD_CHANGE_REQUIRED = "password_change_required";
export const SCHOOL_INACTIVE = "school_inactive";
// require_super_admin's detail: the account is (no longer) a super admin.
export const SUPER_ADMIN_REQUIRED = "Super-admin access required";

export const SCHOOL_INACTIVE_MESSAGE =
  "Your school has been deactivated. Contact your administrator.";
export const PASSWORD_CHANGE_MESSAGE =
  "You must change your temporary password before continuing.";

// Readable by proxy.ts so the forced password change also applies to full page loads.
// It is only a navigation hint: the backend enforces must_change_password itself.
export const PASSWORD_CHANGE_COOKIE = "echosense_password_change";

export const LOGIN_NOTICE_PARAM = "notice";
export const CHANGE_PASSWORD_PATH = "/change-password";

export type ForbiddenKind =
  | "password_change_required"
  | "school_inactive"
  | "super_admin_required"
  | "no_permission";

export function classifyForbiddenDetail(detail: unknown): ForbiddenKind {
  if (detail === PASSWORD_CHANGE_REQUIRED) return "password_change_required";
  if (detail === SCHOOL_INACTIVE) return "school_inactive";
  if (detail === SUPER_ADMIN_REQUIRED) return "super_admin_required";
  return "no_permission";
}

export interface SessionEnvironment {
  pathname: string;
  clearToken: () => void;
  setPasswordChangeFlag: (required: boolean) => void;
  navigate: (destination: string) => void;
  /** Whether a super admin's entered school is set (only super admins set one). */
  hasSchoolScope?: boolean;
  clearSchoolScope?: () => void;
}

export function loginNoticeUrl(notice: typeof SCHOOL_INACTIVE): string {
  return `/login?${LOGIN_NOTICE_PARAM}=${notice}`;
}

export function loginNoticeMessage(search: string): string | null {
  const notice = new URLSearchParams(search).get(LOGIN_NOTICE_PARAM);
  return notice === SCHOOL_INACTIVE ? SCHOOL_INACTIVE_MESSAGE : null;
}

function isPlatformOnlyPath(pathname: string): boolean {
  return pathname === "/schools" || pathname.startsWith("/schools/");
}

/** Applies the session side effects of a 403 and returns how it was classified. */
export function handleForbiddenDetail(
  detail: unknown,
  environment: SessionEnvironment
): ForbiddenKind {
  const kind = classifyForbiddenDetail(detail);
  if (kind === "password_change_required") {
    environment.setPasswordChangeFlag(true);
    if (environment.pathname !== CHANGE_PASSWORD_PATH) {
      environment.navigate(CHANGE_PASSWORD_PATH);
    }
  } else if (kind === "school_inactive") {
    environment.clearToken();
    environment.setPasswordChangeFlag(false);
    environment.navigate(loginNoticeUrl(SCHOOL_INACTIVE));
  } else if (kind === "super_admin_required") {
    // This page still believes the account is a super admin (it was revoked after the
    // page loaded). Drop the school scope and reload so /auth/me is read afresh. Only
    // super-admin screens trigger this, so a school admin's own pages never loop.
    if (environment.hasSchoolScope || isPlatformOnlyPath(environment.pathname)) {
      environment.clearSchoolScope?.();
      environment.navigate("/overview");
    }
  }
  return kind;
}
