// src/lib/axiosInstance.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken } from "./authToken";
import { mockAxiosAdapter, isDemoModeActive, setDemoModeActive } from "./mockAdapter";

export { isDemoModeActive, setDemoModeActive };

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // sends/receives the httpOnly refresh cookie
});

axiosInstance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Intercept with mock adapter if standalone demo mode is active
    if (isDemoModeActive()) {
        config.adapter = mockAxiosAdapter;
    }

    return config;
});

// Broadcast so AuthContext can clear its React state without this module importing React.
type LogoutListener = () => void;
const logoutListeners = new Set<LogoutListener>();
export function onForcedLogout(listener: LogoutListener): () => void {
    logoutListeners.add(listener);
    return () => logoutListeners.delete(listener);
}
function broadcastForcedLogout() {
    setAccessToken(null);
    logoutListeners.forEach((l) => l());
}

// Single-flight refresh: if five requests 401 at once (e.g. a page firing several
// queries on mount), only one POST /auth/refresh goes out; the rest await its result.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = axiosInstance
            .post<{ accessToken: string }>("/auth/refresh")
            .then((res) => {
                setAccessToken(res.data.accessToken);
                return res.data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as
            | (InternalAxiosRequestConfig & { _retry?: boolean; _demoRetry?: boolean })
            | undefined;

        // Auto-activate demo mode if backend is offline / connection refused / network failure
        const isNetworkFailure =
            !error.response ||
            error.code === "ERR_NETWORK" ||
            error.message?.includes("Network Error") ||
            (error.response && error.response.status >= 502);

        if (isNetworkFailure && originalRequest && !originalRequest._demoRetry) {
            console.warn(
                "[axiosInstance] Backend unreachable / network failure. Activating Standalone Demo Mode fallback.",
            );
            setDemoModeActive(true);
            originalRequest._demoRetry = true;
            originalRequest.adapter = mockAxiosAdapter;
            return axiosInstance(originalRequest);
        }

        if (!originalRequest || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Don't try to "refresh" the refresh call itself, and never retry more than once.
        if (originalRequest.url?.includes("/auth/refresh") || originalRequest._retry) {
            broadcastForcedLogout();
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        try {
            const newToken = await refreshAccessToken();
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            broadcastForcedLogout();
            return Promise.reject(refreshError);
        }
    },
);
