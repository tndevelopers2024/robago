import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { leaveDemoIfServerIsUp } from "@/lib/backendProbe";

// If an earlier session fell back to demo mode because the backend was off, and the backend
// is running now, go back to live data before anything renders.
void leaveDemoIfServerIsUp().finally(() => {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
});
