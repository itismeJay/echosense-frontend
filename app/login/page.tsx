"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { School, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import ThemeToggle from "@/components/ThemeToggle";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Signed in");
      router.push(user.must_change_password ? CHANGE_PASSWORD_PATH : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <Link
            href="/"
            className="flex min-h-11 items-center justify-center rounded-control bg-surface px-3 text-link"
            aria-label="Back to EchoSense home"
          >
            <School className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Sign in to EchoSense
          </h1>
          <p className="text-center text-sm text-muted">
            Authorized school personnel only
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg border border-line rounded-control p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-describedby={error ? "login-error" : undefined}
                className="min-h-11 w-full rounded-md border border-line-strong bg-transparent px-3 text-sm text-ink transition placeholder:text-muted"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-describedby={error ? "login-error" : undefined}
                  className="min-h-11 w-full rounded-md border border-line-strong bg-transparent px-3 pr-12 text-sm text-ink transition placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div id="login-error" role="alert" className="flex items-center gap-1.5 text-sm text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-medium text-brand-ink transition-colors hover:bg-brand-hover focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
