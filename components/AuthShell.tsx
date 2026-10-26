import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

/** Sign-in and password pages: one quiet, left-aligned column on the page background. */
export default function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Wordmark href="/" />
        <ThemeToggle />
      </header>
      <main id="main-content" className="flex flex-1 items-start px-4 pb-16 pt-10 sm:items-center sm:px-6 sm:pt-0">
        <div className="w-full max-w-[400px] lg:ml-[10vw]">
          <h1 className="text-display font-semibold text-ink">{title}</h1>
          {description && <div className="mt-2 text-body-lg text-muted">{description}</div>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
