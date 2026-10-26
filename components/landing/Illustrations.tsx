// Simple line illustrations for the landing page. They draw in currentColor so they
// follow the theme; the one green stroke marks what EchoSense acts on.

const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ACCENT = { ...LINE, stroke: "var(--brand)" } as const;

export function ListensIllustration() {
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label="The device picking up voices around it" className="h-24 w-40">
      <ellipse cx="80" cy="62" rx="30" ry="10" {...LINE} />
      <path d="M50 62 v8 a30 10 0 0 0 60 0 v-8" {...LINE} />
      <path d="M58 40 q22 -14 44 0" {...ACCENT} />
      <path d="M44 30 q36 -24 72 0" {...LINE} opacity="0.55" />
      <path d="M30 20 q50 -32 100 0" {...LINE} opacity="0.3" />
    </svg>
  );
}

export function UnderstandsIllustration() {
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label="Words, who they are aimed at, and tone being checked" className="h-24 w-40">
      <rect x="18" y="16" width="86" height="44" rx="10" {...LINE} />
      <path d="M38 60 l-6 14 l18 -14" {...LINE} />
      <path d="M32 32 h34" {...ACCENT} />
      <path d="M32 44 h52" {...LINE} opacity="0.55" />
      <circle cx="126" cy="36" r="10" {...LINE} />
      <path d="M110 70 q16 -18 32 0" {...LINE} />
      <path d="M104 38 h8" {...LINE} opacity="0.55" />
    </svg>
  );
}

export function AlertsIllustration() {
  return (
    <svg viewBox="0 0 160 96" role="img" aria-label="An alert reaching a phone and a dashboard" className="h-24 w-40">
      <rect x="22" y="14" width="40" height="70" rx="8" {...LINE} />
      <rect x="28" y="30" width="28" height="12" rx="3" {...ACCENT} />
      <rect x="78" y="26" width="64" height="44" rx="6" {...LINE} />
      <path d="M88 40 h28" {...ACCENT} />
      <path d="M88 52 h44" {...LINE} opacity="0.55" />
      <path d="M100 82 h20" {...LINE} />
    </svg>
  );
}

/** Audio stays inside the classroom; only a short text alert leaves it. */
export function PrivacyDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      role="img"
      aria-labelledby="privacy-title privacy-desc"
      className="h-auto w-full"
    >
      <title id="privacy-title">Audio stays in the classroom</title>
      <desc id="privacy-desc">
        Inside the classroom, the device hears sound and analyzes it. Only a short text alert leaves the room for the
        school&apos;s phones and dashboard.
      </desc>
      <rect x="12" y="24" width="300" height="252" rx="18" {...LINE} opacity="0.5" />
      <text x="36" y="62" fill="currentColor" opacity="0.7" fontSize="17">
        Classroom
      </text>
      {/* Device */}
      <ellipse cx="162" cy="176" rx="58" ry="18" {...LINE} />
      <path d="M104 176 v16 a58 18 0 0 0 116 0 v-16" {...LINE} />
      <path d="M104 182 a58 18 0 0 0 116 0" {...ACCENT} />
      {/* Sound, contained */}
      <path d="M118 140 q44 -26 88 0" {...LINE} opacity="0.6" />
      <path d="M96 118 q66 -40 132 0" {...LINE} opacity="0.4" />
      <path d="M74 96 q88 -54 176 0" {...LINE} opacity="0.25" />
      <text x="162" y="250" fill="currentColor" opacity="0.7" fontSize="16" textAnchor="middle">
        Audio stays here
      </text>
      {/* Text alert leaving the room */}
      <path d="M232 176 h118" {...ACCENT} strokeDasharray="4 6" />
      <path d="M342 168 l10 8 l-10 8" {...ACCENT} />
      <rect x="362" y="140" width="150" height="72" rx="10" {...LINE} />
      <text x="376" y="170" fill="currentColor" fontSize="16" fontWeight="600">
        High · Grade 6
      </text>
      <text x="376" y="194" fill="currentColor" opacity="0.75" fontSize="15">
        Text alert only
      </text>
    </svg>
  );
}
