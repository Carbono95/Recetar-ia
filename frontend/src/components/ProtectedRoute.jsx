import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import BottomTabBar from "./BottomTabBar.jsx";
import Logo from "./Logo.jsx";
import Navbar from "./Navbar.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sand-500">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Desktop: barra superior completa */}
      <Navbar />

      {/* Móvil: barra slim (marca + salir). La navegación va en la tab bar inferior. */}
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-5 h-12 bg-sand-50/85 backdrop-blur-md">
        <Logo size={28} />
        <button onClick={logout} className="text-[13px] font-bold text-red-600">
          Salir
        </button>
      </div>

      {/* pb-28 en móvil para no tapar contenido con la tab bar fija */}
      <main className="pb-28 md:pb-0">{children}</main>

      <BottomTabBar />
    </div>
  );
}

export default ProtectedRoute;
