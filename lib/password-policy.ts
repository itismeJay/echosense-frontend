// Mirrors the backend rules in app/schemas/user.py (validate_new_password).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export function newPasswordProblem(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string | null {
  const { currentPassword, newPassword, confirmPassword } = input;
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return `The new password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(newPassword).length > PASSWORD_MAX_BYTES) {
    return `The new password must be at most ${PASSWORD_MAX_BYTES} bytes.`;
  }
  if (newPassword === currentPassword) {
    return "The new password must be different from the current password.";
  }
  if (newPassword !== confirmPassword) {
    return "The new password and confirmation do not match.";
  }
  return null;
}
