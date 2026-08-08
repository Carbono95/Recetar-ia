// Tokens del diseño oficial de RecetarIA (RecetarIA iOS.dc.html + tailwind.config
// de la web). Fuente única de verdad para colores, sombras y tipografía del móvil.

export const colors = {
  primary: "#16a34a",
  primary600: "#128a3e",
  primaryTint: "#eaf7ee", // fondo de pastillas verdes (tiempo)
  accent: "#f97316",
  accentTint: "#fff1e6", // fondo de pastillas naranjas (dificultad)
  cream: "#fdf6ec",
  creamDeep: "#f7ecd8", // fin del degradado del login
  screen: "#f2ece0", // fondo de pantalla (sand-50)
  card: "#ffffff",
  ink: "#2b2118", // texto principal
  sand600: "#6b6154",
  sand500: "#8a8072", // texto secundario
  sand400: "#a89f92", // texto terciario / labels
  sand300: "#d8cdb8", // bordes suaves
  sand100: "#f0e6d6",
  hairline: "rgba(60,60,67,0.12)",
  chipGrey: "rgba(120,120,128,0.12)",
  danger: "#dc2626",
  white: "#ffffff",
};

// Familias de Baloo 2 (cargadas en App.js con @expo-google-fonts/baloo-2).
export const fonts = {
  heading: "Baloo2_800ExtraBold",
  headingBold: "Baloo2_700Bold",
};

// Sombras estilo iOS del diseño, adaptadas a las props de React Native.
export const shadows = {
  ios: {
    shadowColor: "#2b2118",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 14,
    shadowOpacity: 0.16,
    elevation: 4,
  },
  card: {
    shadowColor: "#2b2118",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cta: {
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    shadowOpacity: 0.4,
    elevation: 4,
  },
};
