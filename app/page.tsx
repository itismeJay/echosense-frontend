"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Clock3,
  MapPin,
  School,
  ShieldCheck,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: BellRing,
    title: "Clear possible-alert notices",
    description:
      "See the priority, classroom, time, and a plain-language summary in one place.",
  },
  {
    icon: MapPin,
    title: "Classroom context first",
    description:
      "Focus on where and when a possible concern occurred instead of technical model measurements.",
  },
  {
    icon: ShieldCheck,
    title: "For authorized school staff",
    description:
      "The dashboard supports teachers, guidance counselors, and administrators with role-appropriate navigation.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "The classroom device monitors sound patterns",
    description:
      "It looks for signals that may need the attention of authorized school staff.",
  },
  {
    number: "2",
    title: "A possible alert is recorded",
    description:
      "The alert includes its priority, classroom, time, and available supporting information.",
  },
  {
    number: "3",
    title: "School staff view the alert",
    description:
      "Staff use classroom context and school procedures before drawing any conclusion.",
  },
];

export default function LandingPage() {
  const currentUser = useCurrentUser();
  const ctaHref = currentUser ? "/dashboard" : "/login";

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="EchoSense home"
          >
            <span className="rounded-xl bg-indigo-100 p-2 dark:bg-indigo-950/60">
              <School className="h-5 w-5 text-indigo-700 dark:text-indigo-300" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold">EchoSense</span>
          </Link>

          <nav aria-label="Landing page" className="hidden items-center gap-6 text-sm sm:flex">
            <a
              href="#features"
              className="flex min-h-11 items-center text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-300 dark:hover:text-white"
            >
              What you can see
            </a>
            <a
              href="#how-it-works"
              className="flex min-h-11 items-center text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-300 dark:hover:text-white"
            >
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:ring-offset-slate-950"
            >
              {currentUser ? "Open Dashboard" : "Sign in"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
                Classroom Monitoring System
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Possible classroom concerns, shown clearly.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                EchoSense helps authorized school personnel see possible aggression
                alerts with the classroom, time, priority, and available context.
                Automated alerts are unverified and require human judgment.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:ring-offset-slate-900"
                >
                  {currentUser ? "Go to Dashboard" : "Sign in to EchoSense"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Learn how alerts work
                </a>
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                High priority
              </p>
              <h2 className="mt-3 text-xl font-bold">Grade 6 – Section A</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                10:42 AM
              </p>
              <p className="mt-5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                Possible shouting and harmful language may have been detected.
              </p>
              <div className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                Possible alert · Unverified
              </div>
              <span className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">
                View Details
              </span>
            </aside>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              What school staff can see
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              The important information comes first
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                From classroom signal to staff awareness
              </h2>
            </div>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((step) => (
                <li
                  key={step.number}
                  className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-700 text-sm font-bold text-white">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
          <p>EchoSense Classroom Monitoring System</p>
          <p>Automated alerts indicate possible concerns, not confirmed incidents.</p>
        </div>
      </footer>
    </div>
  );
}
