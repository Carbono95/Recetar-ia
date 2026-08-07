import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { configureApi, setNotifier } from "@recetaria/core";

import App from "./App.jsx";
import { webStorage } from "./services/webStorage";
import "./styles/globals.css";

// Configuración web del core: URL de Vite, storage sobre localStorage y
// redirección a /login ante un 401. La lógica en sí vive en @recetaria/core.
configureApi({
  apiUrl: import.meta.env.VITE_API_URL,
  storage: webStorage,
  onUnauthorized: () => {
    window.location.href = "/login";
  },
});

// La implementación de notify() para web. En móvil se configurará con Alert.alert.
setNotifier((message) => window.alert(message));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
