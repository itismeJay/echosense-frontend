import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import DeviceIllustration from "@/components/landing/DeviceIllustration";
import PhoneNotification from "@/components/landing/PhoneNotification";
import {
  AlertsIllustration,
  ListensIllustration,
  PrivacyDiagram,
  UnderstandsIllustration,
} from "@/components/landing/Illustrations";
import { buttonClass } from "@/components/ui/button-class";

// One container for the header, every section and the footer, so all edges line up.
const CONTAINER = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const DISPLAY = "font-semibold tracking-[-0.03em] text-ink";
const H2 = `${DISPLAY} text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.06]`;
const LEAD = "text-[1.0625rem] leading-7 text-muted sm:text-lg sm:leading-8";

const STEPS = [
  {
    title: "Listens",
    text: "The device hears the whole room through four microphones, in English, Filipino and Bisaya.",
    Illustration: ListensIllustration,
  },
  {
    title: "Understands",
    text: "It checks the words used, whether they are aimed at someone, and the tone of voice, and gives a reason for every alert.",
    Illustration: UnderstandsIllustration,
  },
  {
    title: "Alerts the right people",
    text: "Teachers, counselors and administrators get the alert on their phones and the dashboard within seconds.",
    Illustration: AlertsIllustration,
  },
];

const SPECS = [
  { value: "4 mics, 360°", label: "Hears the whole classroom" },
  { value: "3 languages", label: "English, Filipino and Bisaya" },
  { value: "Under 5 seconds", label: "From the words to the alert" },
  { value: "Works offline", label: "Alerts wait and send when the internet is back" },
  { value: "3 levels", label: "Low, Medium and High, each with its reasons" },
];

const ROLES = [
  {
    role: "Teachers",
    summary: "Know the moment something happens in your room.",
    points: ["Phone alert within seconds", "One tap to mark it reviewed"],
  },
  {
    role: "Guidance counselors",
    summary: "See patterns, not just incidents.",
    points: ["Full alert history and reports", "Records that support your RA 10627 anti-bullying work"],
  },
  {
    role: "School administrators",
    summary: "Run every classroom from one place.",
    points: ["Classrooms and their devices", "Who can see what, by role"],
  },
];

const TRUST = [
  {
    title: "No recordings stored",
    text: "Audio is analyzed on the device and then discarded. EchoSense keeps the alert, never the sound.",
  },
  {
    title: "A possible concern, not proof",
    text: "Every alert says what was heard and why it was flagged. A teacher or counselor decides what happened.",
  },
  {
    title: "Each school sees only its own",
    text: "Alerts, classrooms and people are separated by school. Staff see what their role needs, nothing more.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Hero: always dark (true black), in light and dark mode. */}
      <div className="dark border-b border-line bg-bg text-ink">
        <header className={`${CONTAINER} flex h-16 items-center justify-between gap-3`}>
          <Wordmark href="/" />
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <a href="#how-it-works" className="hidden min-h-11 items-center rounded-control px-3 text-body text-muted hover:text-ink sm:inline-flex">
              How it works
            </a>
            <ThemeToggle />
            <Link href="/login" className={buttonClass("secondary", "md")}>
              Sign in
            </Link>
          </nav>
        </header>

        <section aria-labelledby="hero-title" className={`${CONTAINER} grid items-center gap-4 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:min-h-[min(760px,calc(100svh-4rem))] lg:grid-cols-[1fr_1.2fr] lg:gap-8 lg:pb-20 lg:pt-8`}>
          <div className="max-w-[34rem]">
            <h1 id="hero-title" className={`${DISPLAY} text-[clamp(2.75rem,7vw,5rem)] leading-[0.98]`}>
              Hears what cameras can&apos;t.
            </h1>
            <p className={`mt-6 ${LEAD}`}>
              A small device for the classroom that notices bullying and verbal aggression, keeps the audio in the
              room, and tells the right teacher within seconds.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className={buttonClass("primary", "md")}>
                Sign in
              </Link>
              <a href="#how-it-works" className={buttonClass("secondary", "md")}>
                See how it works
              </a>
            </div>
          </div>
          <DeviceIllustration className="mx-auto h-auto w-full max-w-[480px] lg:max-w-[680px]" />
        </section>
      </div>

      <main id="main-content" tabIndex={-1}>
        {/* Privacy */}
        <section aria-labelledby="privacy-title-h" className="border-b border-line">
          <div className={`${CONTAINER} grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16`}>
            <div className="max-w-[34rem]">
              <h2 id="privacy-title-h" className={H2}>
                Audio never leaves the room.
              </h2>
              <p className={`mt-5 ${LEAD}`}>
                Listening and analysis happen on the device itself. When something needs attention, only a short text
                alert is sent: the level, the classroom, and the words that were heard.
              </p>
              <ul className="mt-8 space-y-3 text-body-lg text-ink">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  Analyzed on the device, then discarded
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  No recordings sent or stored
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  Built with the Data Privacy Act of 2012 in mind
                </li>
              </ul>
            </div>
            <div className="w-full max-w-[520px] text-ink lg:justify-self-end">
              <PrivacyDiagram />
            </div>
          </div>
        </section>

        {/* Notification */}
        <section aria-labelledby="notify-title" className="border-b border-line bg-surface">
          <div className={`${CONTAINER} grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1fr_auto] lg:gap-24`}>
            <div className="max-w-[34rem]">
              <h2 id="notify-title" className={H2}>
                The right person knows in seconds.
              </h2>
              <p className={`mt-5 ${LEAD}`}>
                When the device hears something worth checking, the classroom&apos;s teacher, the guidance counselor
                and the administrators get a notification on their phones, and it appears on the dashboard at the
                same time.
              </p>
              <p className={`mt-4 ${LEAD}`}>
                Each alert shows how serious it may be, where it happened, and what was said, so the first person to
                see it knows where to go.
              </p>
            </div>
            <PhoneNotification />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-4 border-b border-line">
          <div className={`${CONTAINER} py-20 sm:py-28`}>
            <h2 id="how-title" className={`${H2} max-w-[34rem]`}>
              How it works
            </h2>
            <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
              {STEPS.map(({ title, text, Illustration }, index) => (
                <li key={title} className="border-t border-line pt-6">
                  <div className="text-ink">
                    <Illustration />
                  </div>
                  <p className="num mt-6 text-body text-muted">Step {index + 1}</p>
                  <h3 className="mt-1 text-title font-semibold text-ink">{title}</h3>
                  <p className="mt-2 max-w-[22rem] text-body-lg text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Spec strip */}
        <section aria-labelledby="specs-title" className="border-b border-line">
          <div className={`${CONTAINER} py-14 sm:py-16`}>
            <h2 id="specs-title" className="sr-only">
              Specifications
            </h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-8 min-[480px]:grid-cols-2 lg:grid-cols-5">
              {SPECS.map((spec) => (
                <div key={spec.value} className="lg:border-l lg:border-line lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                  <dt className="text-[1.375rem] font-semibold leading-7 tracking-[-0.02em] text-ink">{spec.value}</dt>
                  <dd className="mt-1.5 text-body text-muted">{spec.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Roles */}
        <section aria-labelledby="roles-title" className="border-b border-line">
          <div className={`${CONTAINER} py-20 sm:py-28`}>
            <h2 id="roles-title" className={`${H2} max-w-[40rem]`}>
              Built for everyone who looks after students.
            </h2>
            <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
              {ROLES.map((item) => (
                <div key={item.role}>
                  <h3 className="text-title font-semibold text-ink">{item.role}</h3>
                  <p className="mt-2 text-body-lg text-ink">{item.summary}</p>
                  <ul className="mt-4 space-y-2 border-t border-line pt-4 text-body text-muted">
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section aria-labelledby="trust-title" className="bg-surface">
          <div className={`${CONTAINER} py-20 sm:py-28`}>
            <h2 id="trust-title" className={`${DISPLAY} max-w-[44rem] text-[clamp(2.25rem,5.2vw,4rem)] leading-[1.02]`}>
              A person always decides.
            </h2>
            <p className={`mt-5 max-w-[36rem] ${LEAD}`}>
              EchoSense points staff to moments worth a closer look. It never concludes that bullying happened, and it
              never acts on its own.
            </p>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {TRUST.map((item) => (
                <div key={item.title}>
                  <h3 className="text-body-lg font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-body-lg text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action: dark again, to bookend the hero. */}
        <section aria-labelledby="cta-title" className="dark bg-bg text-ink">
          <div className={`${CONTAINER} flex flex-col items-start gap-8 py-20 sm:py-24 lg:flex-row lg:items-end lg:justify-between`}>
            <div className="max-w-[36rem]">
              <h2 id="cta-title" className={H2}>
                Start with one classroom.
              </h2>
              <p className={`mt-4 ${LEAD}`}>
                One device covers one room. Your school administrator adds classrooms, devices and staff accounts
                from the dashboard.
              </p>
            </div>
            <Link href="/login" className={buttonClass("primary", "md")}>
              Sign in to EchoSense
            </Link>
          </div>
        </section>
      </main>

      <footer className="dark bg-bg text-ink">
        <div className={`${CONTAINER} flex flex-col gap-2 border-t border-line py-8 text-body text-muted sm:flex-row sm:items-center sm:justify-between`}>
          <span className="font-medium text-ink">EchoSense</span>
          <span>A DNSC BSIT capstone project, 2026.</span>
        </div>
      </footer>
    </div>
  );
}
