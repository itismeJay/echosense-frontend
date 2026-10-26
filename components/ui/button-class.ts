// Plain (non-client) module so server components such as the landing page can style links as buttons.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

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

