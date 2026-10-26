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
      "Focus on where and when a possible concern happened, not confusing technical numbers.",
  },
  {
    icon: ShieldCheck,
    title: "For authorized school staff",
    description:
      "Teachers, counselors, and administrators each see the menu options built for their job.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "The classroom device listens for certain sounds",
    description:
      "It listens for sounds that may need a staff member's attention.",
  },
  {
    number: "2",
    title: "A possible alert is recorded",
    description:
      "The alert includes how urgent it is, the classroom, the time, and any extra details.",
  },
  {
    number: "3",
    title: "School staff view the alert",
    description:
      "Staff use what they know about the classroom and follow school procedures before deciding what to do.",
  },
];

export default function LandingPage() {
  const currentUser = useCurrentUser();
  const ctaHref = currentUser ? "/dashboard" : "/login";

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-bg">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 rounded-control focus-visible:outline-none"
            aria-label="EchoSense home"
          >
            <span className="rounded-control bg-surface p-2">
              <School className="h-5 w-5 text-link" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">EchoSense</span>
          </Link>

          <nav aria-label="Landing page" className="hidden items-center gap-6 text-sm sm:flex">
            <a
              href="#features"
              className="flex min-h-11 items-center text-muted hover:text-ink focus-visible:outline-none"
            >
              What you can see
            </a>
            <a
              href="#how-it-works"
              className="flex min-h-11 items-center text-muted hover:text-ink focus-visible:outline-none"
            >
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-offset-2 dark:ring-offset-slate-950"
            >
              {currentUser ? "Open Dashboard" : "Sign in"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="border-b border-line bg-bg">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-link">
                Classroom Monitoring System
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Possible classroom concerns, shown clearly.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                EchoSense helps school staff see possible aggression
                alerts with the classroom, time, priority, and any extra details.
                Automated alerts are unverified and require human judgment.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-6 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-offset-2 dark:ring-offset-slate-900"
                >
                  {currentUser ? "Go to Dashboard" : "Sign in to EchoSense"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-control border border-line-strong bg-bg px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-none"
                >
                  Learn how alerts work
                </a>
              </div>
            </div>

            <aside className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
              <p className="text-xs font-semibold text-danger">
                High priority
              </p>
              <h2 className="mt-3 text-xl font-semibold">Grade 6 – Section A</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                10:42 AM
              </p>
              <p className="mt-5 text-sm leading-6 text-ink">
                Possible shouting and harmful language may have been detected.
              </p>
              <div className="mt-5 rounded-control bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                Possible alert · Unverified
              </div>
              <span className="mt-5 inline-flex min-h-11 items-center rounded-control bg-brand px-4 py-2 text-sm font-semibold text-brand-ink">
                View Details
              </span>
            </aside>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-link">
              What school staff can see
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              The important information comes first
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-panel border border-line bg-bg p-6"
              >
                <span className="inline-flex rounded-control bg-surface p-3 text-link">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-bg">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-link">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                From classroom signal to staff awareness
              </h2>
            </div>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((step) => (
                <li
                  key={step.number}
                  className="rounded-panel border border-line p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>EchoSense Classroom Monitoring System</p>
          <p>Automated alerts indicate possible concerns, not confirmed incidents.</p>
        </div>
      </footer>
    </div>
  );
}
