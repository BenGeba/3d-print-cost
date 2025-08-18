// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"
import App from "./App";
import "./tailwind.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root element with id "root" not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
