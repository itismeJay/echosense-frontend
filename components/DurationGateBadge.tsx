import { durationGateLabel } from "@/lib/format";

interface DurationGateBadgeProps {
  gate?: string | null;
  size?: "sm" | "md";
}

const GATE_COLORS: Record<string, string> = {
  threat:   "bg-danger-bg text-danger border-danger/40   ",
  hard:     "bg-danger-bg text-danger border-danger/40   ",
  repeated: "bg-surface text-muted border-line   ",
  medium:   "bg-sev-medium-bg text-sev-medium border-sev-medium/40   ",
  soft:     "bg-surface text-muted border-line-strong   ",
};

export default function DurationGateBadge({ gate, size = "sm" }: DurationGateBadgeProps) {
  if (!gate) return null;
  const sizeClass = size === "md"
    ? "px-2.5 py-1 text-xs"
    : "px-2 py-0.5 text-[11px]";
  const colorClass = GATE_COLORS[gate] ?? "bg-surface text-muted border-line-strong  ";
  return (
    <span className={`inline-flex items-center font-semibold rounded-tag border ${sizeClass} ${colorClass}`}>
      {durationGateLabel(gate)}
    </span>
  );
}
