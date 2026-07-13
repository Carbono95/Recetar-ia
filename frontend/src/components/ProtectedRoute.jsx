import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import Navbar from "./Navbar.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default ProtectedRoute;
