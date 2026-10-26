import { durationGateLabel } from "@/lib/format";

interface DurationGateBadgeProps {
  gate?: string | null;
  size?: "sm" | "md";
}

const GATE_COLORS: Record<string, string> = {
  threat:   "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
  hard:     "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
  repeated: "bg-blue-500/10 text-blue-600 border-blue-500/20   ",
  medium:   "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
  soft:     "bg-gray-500/10 text-muted border-line-strong   ",
};

export default function DurationGateBadge({ gate, size = "sm" }: DurationGateBadgeProps) {
  if (!gate) return null;
  const sizeClass = size === "md"
    ? "px-2.5 py-1 text-xs"
    : "px-2 py-0.5 text-[11px]";
  const colorClass = GATE_COLORS[gate] ?? "bg-gray-500/10 text-muted border-line-strong  ";
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${sizeClass} ${colorClass}`}>
      {durationGateLabel(gate)}
    </span>
  );
}
