import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { LogoIcon } from "../components/Logo.jsx";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-[#f7ecd8] px-5 py-8">
      <div className="w-full max-w-[380px] flex flex-col items-center gap-6">
        <LogoIcon size={72} />

        <div className="text-center">
          <div className="font-heading font-extrabold text-[28px] text-ink">Crear cuenta</div>
          <div className="text-sm font-semibold text-sand-500 mt-1">
            únete a Recetar<span className="text-primary-500 font-extrabold">IA</span>
          </div>
        </div>

        <div className="w-full bg-white rounded-[22px] p-6 shadow-card flex flex-col gap-3.5">
          <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[13px] text-sand-600">Usuario</label>
              <input
                type="text"
                placeholder="usuario123"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="px-3.5 py-3 rounded-xl border border-sand-200 text-[15px] outline-none focus:border-accent-500"
                minLength={3}
                pattern="[a-zA-Z0-9_]+"
                title="Solo letras, números y guion bajo"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[13px] text-sand-600">Contraseña</label>
              <input
                type="password"
                placeholder="mínimo 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="px-3.5 py-3 rounded-xl border border-sand-200 text-[15px] outline-none focus:border-accent-500"
                minLength={8}
                required
              />
            </div>

            {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1.5 px-4 py-3.5 border-none rounded-[16px] bg-accent-500 hover:bg-accent-600 text-white font-extrabold text-[16px] shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <div className="text-sm text-sand-600">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="font-bold">
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
