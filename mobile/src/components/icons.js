import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

import { colors } from "../theme";

// Iconos de la barra de pestañas, portados de RecetarIA iOS.dc.html.
export function TabIcon({ kind, active, size = 25 }) {
  const c = active ? colors.primary : colors.sand400;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === "recetas" && (
        <Path
          d="M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2V4z M5 4a2 2 0 00-2 2v12"
          stroke={c}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {kind === "semana" && (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={3} stroke={c} strokeWidth={1.8} fill="none" />
          <Path d="M4 9h16M8 3v3M16 3v3" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {kind === "lista" && (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={4} stroke={c} strokeWidth={1.8} fill="none" />
          <Path d="M8 12l3 3 5-6" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}

// Placeholder de plato (dos círculos concéntricos), como en el diseño.
export function PlateIcon({ size = 46, color = colors.ink }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={28} fill="none" stroke={color} strokeWidth={4} />
      <Circle cx={32} cy={32} r={16} fill="none" stroke={color} strokeWidth={3} />
    </Svg>
  );
}

// Mascota robot-chef del login, portada de la función makeBot del diseño.
export function Mascot({ size = 104 }) {
  const primary = colors.primary;
  const accent = colors.accent;
  const cream = colors.cream;
  const ink = colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* brazo/cuchara izquierda */}
      <Rect x={42} y={118} width={30} height={8} rx={4} rotation={-14} originX={57} originY={122} fill={primary} />
      <Rect x={30} y={96} width={7} height={22} rx={3.5} rotation={-8} originX={33} originY={107} fill={primary} />
      <Ellipse cx={30} cy={92} rx={9} ry={13} fill={primary} rotation={-6} originX={30} originY={92} />
      {/* brazo/tenedor derecho */}
      <Rect x={134} y={118} width={26} height={9} rx={4.5} rotation={18} originX={147} originY={122} fill={accent} />
      <Rect x={158} y={92} width={8} height={22} rx={3} fill={accent} />
      <Rect x={168} y={92} width={8} height={22} rx={3} fill={accent} />
      <Rect x={178} y={92} width={8} height={22} rx={3} fill={accent} />
      <Rect x={160} y={112} width={24} height={10} rx={5} fill={accent} />
      {/* antena */}
      <Rect x={97} y={20} width={6} height={20} rx={3} fill={ink} />
      <Circle cx={100} cy={18} r={7} fill={accent} />
      {/* cuerpo */}
      <Rect x={58} y={112} width={84} height={54} rx={20} fill={cream} stroke={primary} strokeWidth={4} />
      <Rect x={84} y={126} width={32} height={32} rx={9} fill={accent} />
      <Path d="M92 142 L98 148 L110 134" stroke={cream} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={70} y={164} width={18} height={12} rx={6} fill={primary} />
      <Rect x={112} y={164} width={18} height={12} rx={6} fill={primary} />
      {/* cabeza */}
      <Rect x={48} y={42} width={104} height={74} rx={26} fill={primary} />
      <Circle cx={78} cy={76} r={11} fill={cream} />
      <Circle cx={122} cy={76} r={11} fill={cream} />
      <Circle cx={78} cy={78} r={5} fill={ink} />
      <Circle cx={122} cy={78} r={5} fill={ink} />
      <Path d="M82 96 Q100 108 118 96" stroke={cream} strokeWidth={5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
