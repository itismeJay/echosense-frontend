import Link from "next/link";

/** The EchoSense mark: a green tile with four sound bars. */
export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="var(--brand)" />
      <path d="M7 9v6M10.5 7v10M14 9.5v5M17.5 11v2" stroke="var(--brand-ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Wordmark({ href, collapsed = false }: { href: string; collapsed?: boolean }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2.5 rounded-control px-1 text-ink">
      <LogoMark />
      <span className={collapsed ? "sr-only" : "text-body-lg font-semibold"}>EchoSense</span>
    </Link>
  );
}
