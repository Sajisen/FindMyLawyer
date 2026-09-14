import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import ScrollToTop from "./components/navigation/ScrollToTop.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SavedLawyersProvider } from "./context/SavedLawyersContext.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <SavedLawyersProvider>
          <App />
        </SavedLawyersProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
