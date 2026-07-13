const COLORS = {
  light: { primary: "#16a34a", accent: "#f97316", cream: "#fdf6ec", ink: "#2b2118" },
  dark: { primary: "#f97316", accent: "#16a34a", cream: "#fdf6ec", ink: "#1a1410" },
};

export function LogoIcon({ size = 40, variant = "light", className = "" }) {
  const { primary, accent, cream, ink } = COLORS[variant];

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label="RecetarIA">
      {/* brazo izquierdo: cuchara */}
      <rect x="42" y="118" width="30" height="8" rx="4" transform="rotate(-14 57 122)" fill={primary} />
      <rect x="30" y="96" width="7" height="22" rx="3.5" transform="rotate(-8 33 107)" fill={primary} />
      <ellipse cx="30" cy="92" rx="9" ry="13" fill={primary} transform="rotate(-6 30 92)" />
      {/* brazo derecho: tenedor */}
      <rect x="134" y="118" width="26" height="9" rx="4.5" transform="rotate(18 147 122)" fill={accent} />
      <rect x="158" y="92" width="8" height="22" rx="3" fill={accent} />
      <rect x="168" y="92" width="8" height="22" rx="3" fill={accent} />
      <rect x="178" y="92" width="8" height="22" rx="3" fill={accent} />
      <rect x="160" y="112" width="24" height="10" rx="5" fill={accent} />
      {/* antena */}
      <rect x="97" y="20" width="6" height="20" rx="3" fill={ink} />
      <circle cx="100" cy="18" r="7" fill={accent} />
      {/* cuerpo */}
      <rect x="58" y="112" width="84" height="54" rx="20" fill={cream} stroke={primary} strokeWidth="4" />
      <rect x="84" y="126" width="32" height="32" rx="9" fill={accent} />
      <path
        d="M92 142 L98 148 L110 134"
        stroke={cream}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* pies */}
      <rect x="70" y="164" width="18" height="12" rx="6" fill={primary} />
      <rect x="112" y="164" width="18" height="12" rx="6" fill={primary} />
      {/* cabeza */}
      <rect x="48" y="42" width="104" height="74" rx="26" fill={primary} />
      <circle cx="78" cy="76" r="11" fill={cream} />
      <circle cx="122" cy="76" r="11" fill={cream} />
      <circle cx="78" cy="78" r="5" fill={ink} />
      <circle cx="122" cy="78" r="5" fill={ink} />
      <path d="M82 96 Q100 108 118 96" stroke={cream} strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ size = 40, showTagline = false, variant = "light", className = "" }) {
  const wordmarkColor = variant === "dark" ? "#fdf6ec" : "oklch(0.28 0.02 150)";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={size} variant={variant} />
      <div className="flex flex-col leading-none">
        <span
          style={{ fontFamily: "'Baloo 2', sans-serif", color: wordmarkColor }}
          className="font-extrabold text-xl"
        >
          Recetar<span style={{ color: COLORS[variant].primary }}>IA</span>
        </span>
        {showTagline && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">
            tu chef con inteligencia artificial
          </span>
        )}
      </div>
    </div>
  );
}

export default Logo;
