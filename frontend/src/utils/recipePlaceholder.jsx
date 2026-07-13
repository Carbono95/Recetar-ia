const PLACEHOLDER_COLORS = ["#fde8dc", "#e6f2e0", "#fdf0d8", "#fde0d0", "#eaf2e6", "#f2e9d8"];

export function getPlaceholderColor(id) {
  return PLACEHOLDER_COLORS[id % PLACEHOLDER_COLORS.length];
}

export function PlacePlateIcon({ size = 44, color = "#2b2118", className = "" }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={{ opacity: 0.55 }}>
      <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="32" cy="32" r="16" fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
}
