import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { LogoIcon } from "../components/Logo.jsx";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(username, password);
      navigate("/recipes");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-[#f7ecd8] px-5 py-8">
      <div className="w-full max-w-[380px] flex flex-col items-center gap-6">
        <LogoIcon size={88} />

        <div className="text-center">
          <div className="font-heading font-extrabold text-3xl text-ink">
            Recetar<span className="text-primary-500">IA</span>
          </div>
          <div className="text-sm font-semibold text-sand-500 mt-1">tu chef con inteligencia artificial</div>
        </div>

        <div className="w-full bg-white rounded-[22px] p-6 shadow-card flex flex-col gap-3.5">
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[13px] text-sand-600">Usuario</label>
              <input
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="px-3.5 py-3 rounded-xl border border-sand-200 text-[15px] outline-none focus:border-primary-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[13px] text-sand-600">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="px-3.5 py-3 rounded-xl border border-sand-200 text-[15px] outline-none focus:border-primary-500"
                required
              />
            </div>

            {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1.5 px-4 py-3.5 border-none rounded-[16px] bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-[16px] shadow-cta disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? "Iniciando sesión..." : "Entrar"}
            </button>
          </form>
        </div>

        <div className="text-sm text-sand-600">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="font-bold">
            Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
