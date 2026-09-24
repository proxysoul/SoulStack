import "./app.css";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";

const app = document.getElementById("app");
if (!app) throw new Error("SoulStack: #app is missing from index.html");

createRoot(app).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
