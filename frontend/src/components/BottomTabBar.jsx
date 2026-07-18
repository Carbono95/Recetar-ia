import { Link, useLocation } from "react-router-dom";

// Tab bar inferior estilo iOS (solo móvil). Iconos y colores tomados del diseño
// "RecetarIA iOS.dc.html". En desktop se usa la Navbar superior en su lugar.
const TABS = [
  {
    to: "/recipes",
    label: "Recetas",
    match: (pathname) => pathname.startsWith("/recipes"),
    icon: (color) => (
      <path
        d="M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2V4z M5 4a2 2 0 00-2 2v12"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    to: "/shopping",
    label: "Lista",
    match: (pathname) => pathname.startsWith("/shopping"),
    icon: (color) => (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="1.8" fill="none" />
        <path d="M8 12l3 3 5-6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    to: "/meal-plan",
    label: "Planner",
    match: (pathname) => pathname.startsWith("/meal-plan"),
    icon: (color) => (
      <>
        <rect x="4" y="5" width="16" height="15" rx="3" stroke={color} strokeWidth="1.8" fill="none" />
        <path d="M4 9h16M8 3v3M16 3v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
];

function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex justify-around pt-2 border-t border-black/5 bg-white/80 backdrop-blur-xl"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const color = active ? "#16a34a" : "#a89f92";
        return (
          <Link key={tab.to} to={tab.to} className="flex flex-col items-center gap-0.5 px-4">
            <svg width="25" height="25" viewBox="0 0 24 24">
              {tab.icon(color)}
            </svg>
            <span className="text-[10px] font-semibold" style={{ color }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
