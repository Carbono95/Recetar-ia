import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo.jsx";

const NAV_LINKS = [
  { to: "/recipes", label: "Recetas" },
  { to: "/recipes?favorites=true", label: "Favoritos" },
  { to: "/shopping", label: "Lista de compra" },
  { to: "/meal-plan", label: "Planner" },
];

function Navbar() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <Link to="/recipes" onClick={closeMenu}>
          <Logo size={32} />
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-gray-600 hover:text-gray-900">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={logout} className="hidden md:block text-sm text-red-600">
            Cerrar sesión
          </button>
          <button
            type="button"
            className="md:hidden p-2 -mr-2"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsOpen((open) => !open)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div id="mobile-menu" className="md:hidden flex flex-col px-6 pb-3 border-t">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className="py-3 text-gray-600 hover:text-gray-900 border-b last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              closeMenu();
              logout();
            }}
            className="py-3 text-left text-sm text-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
