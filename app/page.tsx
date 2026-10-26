"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import { buttonClass } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth";

const STEPS = [
  {
    title: "A classroom device listens",
    description: "It picks up monitored words and raised voices. Recordings are not sent to EchoSense.",
  },
  {
    title: "An alert appears for review",
    description: "Staff see how serious it may be, which classroom, when, and the words that were heard.",
  },
  {
    title: "A person decides what happened",
    description: "Teachers and counselors check the classroom, follow school procedures, and mark it reviewed.",
  },
];

// An illustration of the alert inbox, labelled as an example. Not real data.
const EXAMPLE_ROWS = [
  {
    severity: "High",
    stripe: "bg-sev-high",
    tag: "bg-sev-high-bg text-sev-high border-sev-high/40",
    room: "Grade 6",
    words: ["“bobo”", "“tanga”"],
    time: "8:15 AM",
  },
  {
    severity: "Medium",
    stripe: "bg-sev-medium",
    tag: "bg-sev-medium-bg text-sev-medium border-sev-medium/40",
    room: "Grade 5",
    words: ["Raised voices"],
    time: "7:58 AM",
  },
  {
    severity: "Low",
    stripe: "bg-sev-low",
    tag: "bg-sev-low-bg text-sev-low border-sev-low/40",
    room: "Grade 4",
    words: ["“pangit”"],
    time: "Yesterday",
  },
];

export default function LandingPage() {
  const currentUser = useCurrentUser();
  const ctaHref = currentUser ? "/overview" : "/login";

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-line">
        <div className="flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Wordmark href="/" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={ctaHref} className={buttonClass("secondary", "md")}>
              {currentUser ? "Open EchoSense" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-xl">
            <h1 className="text-[2.5rem] font-semibold leading-[2.875rem] text-ink sm:text-[3rem] sm:leading-[3.5rem]">
              Know when a classroom needs you.
            </h1>
            <p className="mt-5 text-body-lg text-muted">
              EchoSense listens for signs of bullying and aggression in classrooms and tells teachers, guidance
              counselors and school administrators what needs a closer look.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={ctaHref} className={buttonClass("primary", "md")}>
                {currentUser ? "Open EchoSense" : "Sign in"}
              </Link>
              <span className="text-body text-muted">For school staff with an EchoSense account.</span>
            </div>
          </div>

          <figure aria-label="Example of the alert list" className="min-w-0">
            <ul className="rounded-panel border border-line bg-bg">
              {EXAMPLE_ROWS.map((row) => (
                <li key={row.room} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <span aria-hidden="true" className={`w-1 self-stretch rounded-full ${row.stripe}`} />
                  <span
                    className={`min-w-[4.25rem] rounded-tag border px-1.5 py-0.5 text-center text-small font-medium ${row.tag}`}
                  >
                    {row.severity}
                  </span>
                  <span className="w-20 shrink-0 text-body-lg font-medium text-ink">{row.room}</span>
                  <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                    {row.words.map((word) => (
                      <span key={word} className="rounded-tag bg-surface px-1.5 py-0.5 text-body text-ink">
                        {word}
                      </span>
                    ))}
                  </span>
                  <span className="num hidden text-body text-muted sm:block">{row.time}</span>
                </li>
              ))}
            </ul>
            <figcaption className="mt-2 text-small text-muted">Example of the alert list. Not real data.</figcaption>
          </figure>
        </section>

        <section aria-labelledby="how-title" className="border-t border-line bg-surface">
          <div className="max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
            <h2 id="how-title" className="text-title font-semibold text-ink">
              How it works
            </h2>
            <ol className="mt-6 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="max-w-sm">
                  <span className="num text-figure font-medium text-muted">{index + 1}</span>
                  <h3 className="mt-2 text-body-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-body text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-2xl text-body text-muted">
              Alerts are possible concerns, not proof. EchoSense never decides what happened; school staff do.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
