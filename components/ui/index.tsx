"use client";

// Shared building blocks. Every color, radius and shadow comes from the tokens in
// app/globals.css, so these render correctly in light and dark without dark: overrides.

import Link from "next/link";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  secondary: "border border-line-strong bg-bg text-ink hover:bg-surface",
  ghost: "text-ink hover:bg-surface",
  danger: "border border-danger text-danger hover:bg-danger-bg",
};

const SIZE: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-body",
  sm: "min-h-9 px-3 text-small",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md") {
  return `inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  pending?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon: Icon, pending = false, className = "", children, type = "button", disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${buttonClass(variant, size)} ${className}`}
      {...rest}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  icon: Icon,
  children,
  className = "",
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </Link>
  );
}

/** Page container: left aligned, about 1200px wide. */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-display font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-body-lg text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "p-4 sm:p-5",
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={`rounded-panel border border-line bg-bg ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-body-lg font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-small text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}

/** Tabs that are links to sub-routes, so each tab deep-links. */
export function TabLinks({
  label,
  tabs,
  current,
}: {
  label: string;
  tabs: { href: string; label: string; count?: number }[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="mb-5 border-b border-line">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.href === current;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-body font-medium whitespace-nowrap ${
                  active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`num rounded-tag px-1.5 text-small ${
                      active ? "bg-ink text-bg" : "bg-surface text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tells the user what to do next when there is nothing to show. */
export function EmptyState({
  title,
  children,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-start gap-2 px-4 py-8 sm:px-5">
      <Icon className="h-5 w-5 text-muted" aria-hidden="true" />
      <p className="text-body-lg font-medium text-ink">{title}</p>
      {children && <p className="max-w-prose text-body text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Explains what went wrong and how to fix it. */
export function ErrorState({
  title,
  children,
  onRetry,
  retryLabel = "Try again",
}: {
  title: string;
  children?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-panel border border-danger/40 bg-danger-bg px-4 py-4 sm:px-5">
      <p className="flex items-center gap-2 text-body-lg font-medium text-ink">
        <AlertCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        {title}
      </p>
      {children && <p className="max-w-prose text-body text-ink">{children}</p>}
      {onRetry && (
        <Button size="sm" icon={RefreshCw} onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/** A quiet informational line, e.g. read-only notices. */
export function Note({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <p className="flex items-start gap-2 rounded-control bg-surface px-3 py-2.5 text-body text-muted">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

export function Skeleton({ className = "h-16" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-surface ${className}`} />;
}

export function LoadingRows({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" className="space-y-2 p-4">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12" />
      ))}
    </div>
  );
}

// ── Form controls ──────────────────────────────────────────────────

export const labelClass = "block text-body font-medium text-ink";
export const hintClass = "mt-1 text-small text-muted";
export const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 text-body text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";
export const selectClass = inputClass;

export function Field({
  id,
  label,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-2 text-body text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Small key/value pair used in detail panels. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-body text-ink">{children}</dd>
    </div>
  );
}
