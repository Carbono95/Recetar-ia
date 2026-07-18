import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { setNotifier } from "./services/notify";
import "./styles/globals.css";

// La implementación de notify() para web. En móvil se configurará con Alert.alert.
setNotifier((message) => window.alert(message));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
