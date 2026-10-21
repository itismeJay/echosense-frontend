import Link from "next/link";
import { ShieldOff } from "lucide-react";

interface NoAccessProps {
  description?: string;
}

export default function NoAccess({
  description = "Your account does not have access to this page. If you need it, ask your school administrator.",
}: NoAccessProps) {
  return (
    <div className="mx-auto max-w-xl p-4 md:p-6 lg:p-8">
      <section
        role="alert"
        aria-labelledby="no-access-title"
        className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <ShieldOff className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1
          id="no-access-title"
          className="mt-4 text-xl font-bold text-slate-950 dark:text-white"
        >
          No access
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          Go to Dashboard
        </Link>
      </section>
    </div>
  );
}
