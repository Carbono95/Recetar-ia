import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo.jsx";

const NAV_LINKS = [
  { to: "/recipes", label: "Recetas", match: (pathname) => pathname.startsWith("/recipes") },
  { to: "/shopping", label: "Lista de compra", match: (pathname) => pathname.startsWith("/shopping") },
  { to: "/meal-plan", label: "Planner", match: (pathname) => pathname.startsWith("/meal-plan") },
];

function Navbar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const linkClass = (active) =>
    `font-bold text-[15px] ${active ? "text-primary-500" : "text-sand-600 hover:text-ink"}`;

  return (
    <nav className="sticky top-0 z-20 border-b border-sand-100 bg-white">
      <div className="max-w-content mx-auto flex items-center justify-between px-5 py-3.5">
        <Link to="/recipes" onClick={closeMenu} className="flex items-center">
          <Logo size={38} />
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.match(location.pathname))}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3.5">
          <button onClick={logout} className="hidden md:block text-sm font-bold text-red-600">
            Cerrar sesión
          </button>
          <button
            type="button"
            className="md:hidden w-10 h-10 rounded-xl bg-cream text-ink flex items-center justify-center"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsOpen((open) => !open)}
          >
            <svg width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-menu" className="md:hidden flex flex-col px-5 pb-3 border-t border-sand-100">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={`py-2.5 ${linkClass(link.match(location.pathname))}`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              closeMenu();
              logout();
            }}
            className="py-2.5 text-left text-sm font-bold text-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
