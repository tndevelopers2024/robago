import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Wipe any previous mock demo cache from localStorage so the frontend strictly uses live database data
if (typeof window !== "undefined" && window.localStorage) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("robago_demo")) {
            localStorage.removeItem(key);
        }
    }
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
