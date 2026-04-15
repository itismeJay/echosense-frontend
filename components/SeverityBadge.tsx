import type { Severity } from "@/lib/types";
import { severityColor } from "@/lib/format";

interface SeverityBadgeProps {
  severity: Severity;
  dot?: boolean;
}

export default function SeverityBadge({ severity, dot = false }: SeverityBadgeProps) {
  const colors = severityColor(severity);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${colors}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {severity}
    </span>
  );
}
