// src/lib/backendProbe.ts
function healthUrl(): string {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";
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

export async function leaveDemoIfServerIsUp(): Promise<boolean> {
    return false;
}
