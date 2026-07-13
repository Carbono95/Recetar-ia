import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "../components/Logo.jsx";
import { useAuth } from "../hooks/useAuth";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register(username, password);
      navigate("/login");
    } catch (err) {
      setError(err.message || "No se pudo completar el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <h1 className="text-xl font-bold mb-6 text-center text-gray-700">Crear cuenta</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Usuario (mínimo 3 caracteres, sin espacios)"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full px-4 py-2 border rounded"
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            title="Solo letras, números y guion bajo"
            required
          />

          <input
            type="password"
            placeholder="Password (mínimo 8 caracteres)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-4 py-2 border rounded"
            minLength={8}
            required
          />

          {error && <div className="text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-center">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
