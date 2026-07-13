import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo.jsx";

function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <div className="flex items-center gap-4">
        <Link to="/recipes">
          <Logo size={32} />
        </Link>
        <Link to="/recipes" className="text-gray-600 hover:text-gray-900">
          Recetas
        </Link>
        <Link to="/recipes?favorites=true" className="text-gray-600 hover:text-gray-900">
          Favoritos
        </Link>
        <Link to="/shopping" className="text-gray-600 hover:text-gray-900">
          Lista de compra
        </Link>
        <Link to="/meal-plan" className="text-gray-600 hover:text-gray-900">
          Planner
        </Link>
      </div>
      <button onClick={logout} className="text-sm text-red-600">
        Cerrar sesión
      </button>
    </nav>
  );
}

export default Navbar;
