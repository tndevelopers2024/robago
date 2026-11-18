// src/lib/backendProbe.ts
import { isDemoForced, isDemoModeActive, setDemoModeActive } from "./mockAdapter";

function healthUrl(): string {
    const api = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    return api.replace(/\/api\/v1\/?$/, "") + "/health";
}

/** True when the real backend answers its health check. */
export async function isBackendUp(timeoutMs = 1500): Promise<boolean> {
    try {
        const res = await fetch(healthUrl(), { signal: AbortSignal.timeout(timeoutMs) });
        return res.ok;
    } catch {
        return false;
    }
}

/** If the app fell back to demo mode earlier (backend was off) and the server is up now,
 *  switch demo mode off so the app uses live, shared data again. Returns true if it switched. */
export async function leaveDemoIfServerIsUp(): Promise<boolean> {
    if (!isDemoModeActive() || isDemoForced()) return false;
    if (!(await isBackendUp())) return false;
    setDemoModeActive(false);
    return true;
}
