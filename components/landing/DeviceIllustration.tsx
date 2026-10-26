// The EchoSense classroom device: a matte puck with a 360° mic ring and a soft green
// light ring, with sound waves moving outward. Drawn here, not a product photo.

const WAVES = [0, 1.2, 2.4, 3.6];

export default function DeviceIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 40 560 440"
      role="img"
      aria-labelledby="device-title device-desc"
      className={className}
    >
      <title id="device-title">The EchoSense classroom device</title>
      <desc id="device-desc">
        A small round matte-black device with a soft green light ring around its top, with sound waves moving
        outward from it.
      </desc>
      <defs>
        <radialGradient id="es-halo" cx="50%" cy="46%" r="50%">
          <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#3ECF8E" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="es-side" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0c0c0c" />
          <stop offset="35%" stopColor="#232323" />
          <stop offset="62%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#070707" />
        </linearGradient>
        <radialGradient id="es-top" cx="42%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#2f2f2f" />
          <stop offset="60%" stopColor="#1b1b1b" />
          <stop offset="100%" stopColor="#111111" />
        </radialGradient>
        <radialGradient id="es-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="es-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Halo and sound waves, centred on the device */}
      <ellipse cx="280" cy="250" rx="270" ry="240" fill="url(#es-halo)" />
      <g fill="none" stroke="#3ECF8E" strokeWidth="1.5">
        {WAVES.map((delay) => (
          <ellipse
            key={delay}
            className="es-wave"
            cx="280"
            cy="262"
            rx="250"
            ry="150"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </g>

      {/* Floor shadow */}
      <ellipse cx="280" cy="372" rx="170" ry="26" fill="url(#es-shadow)" />

      {/* Body: a short cylinder */}
      <path d="M130 262 v58 a150 52 0 0 0 300 0 v-58 z" fill="url(#es-side)" />
      <path d="M130 320 a150 52 0 0 0 300 0" fill="none" stroke="#2c2c2c" strokeWidth="1" />

      {/* Light ring: glow and crisp line just under the top edge */}
      <ellipse
        className="es-glow"
        cx="280"
        cy="270"
        rx="150"
        ry="52"
        fill="none"
        stroke="#3ECF8E"
        strokeWidth="10"
        filter="url(#es-blur)"
        opacity="0.9"
      />
      <path d="M130 270 a150 52 0 0 0 300 0" fill="none" stroke="#3ECF8E" strokeWidth="2.5" />

      {/* Top face */}
      <ellipse cx="280" cy="262" rx="150" ry="52" fill="url(#es-top)" />
      <ellipse cx="280" cy="262" rx="150" ry="52" fill="none" stroke="#3a3a3a" strokeWidth="1" />

      {/* Four microphones around the top, a 360° array */}
      {[
        [280, 226],
        [376, 262],
        [280, 298],
        [184, 262],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4.5" ry="2" fill="#050505" stroke="#3a3a3a" strokeWidth="0.75" />
      ))}

      {/* Small sound-bar mark in the centre */}
      <g stroke="#6f6f6f" strokeWidth="3" strokeLinecap="round" transform="translate(280 262) scale(1 0.42)">
        <path d="M-15 -6 v12" />
        <path d="M-5 -14 v28" />
        <path d="M5 -9 v18" />
        <path d="M15 -3 v6" />
      </g>
    </svg>
  );
}
