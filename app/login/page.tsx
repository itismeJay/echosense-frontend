"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { Button, FormError, inputClass, labelClass } from "@/components/ui";
import { accessRoleOf, homePathFor } from "@/lib/access";
import { login } from "@/lib/auth";
import { CHANGE_PASSWORD_PATH, loginNoticeMessage } from "@/lib/session-errors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // e.g. /login?notice=school_inactive after the backend ended the session.
  useEffect(() => {
    const notice = loginNoticeMessage(window.location.search);
    if (!notice) return;
    const timer = setTimeout(() => setError(notice), 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(user.must_change_password ? CHANGE_PASSWORD_PATH : homePathFor(accessRoleOf(user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in didn't work. Try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="For school staff with an EchoSense account. Your school administrator can create one for you."
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? "login-error" : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={error ? "login-error" : undefined}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute bottom-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {error && <FormError id="login-error">{error}</FormError>}
        <Button type="submit" variant="primary" pending={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
