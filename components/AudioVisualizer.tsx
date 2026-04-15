"use client";

const BARS = 24;

interface AudioVisualizerProps {
  variant?: "hero" | "dashboard";
  intensity?: "idle" | "alert";
}

export default function AudioVisualizer({
  variant = "dashboard",
  intensity = "idle",
}: AudioVisualizerProps) {
  const containerHeight = variant === "hero" ? "h-32" : "h-14";
  const animDuration = intensity === "alert" ? "0.55s" : "1.1s";
  const gradient =
    intensity === "alert"
      ? "from-red-500 via-orange-400 to-red-600"
      : "from-indigo-500 via-purple-500 to-cyan-400";
  const glowColor =
    intensity === "alert"
      ? "drop-shadow(0 0 6px rgba(239,68,68,0.5))"
      : "drop-shadow(0 0 4px rgba(99,102,241,0.4))";

  return (
    <div
      className={`flex items-end justify-center gap-0.5 w-full ${containerHeight}`}
      style={{ filter: glowColor }}
      aria-hidden="true"
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-gradient-to-t ${gradient}`}
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: `wave-bar ${animDuration} ease-in-out infinite`,
            animationDelay: `${i * 46}ms`,
            transform: "scaleY(0.15)",
          }}
        />
      ))}
    </div>
  );
}
