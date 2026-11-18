// src/lib/axiosInstance.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    setRefreshToken,
    clearAuthTokens,
} from "./authToken";

// Live REST API only: mock/demo mode is permanently disabled.
export function isDemoModeActive(): boolean {
    return false;
}

export function setDemoModeActive(_enabled: boolean): void {
    // No-op: Real REST API only. Mock data & localStorage fallback disabled.
}

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1",
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
    clearAuthTokens();
    logoutListeners.forEach((l) => l());
}

// Single-flight refresh: if five requests 401 at once (e.g. a page firing several
// queries on mount), only one POST /auth/refresh goes out; the rest await its result.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        const rf = getRefreshToken();
        refreshPromise = axiosInstance
            .post<{ accessToken: string; refreshToken?: string }>(
                "/auth/refresh",
                rf ? { refreshToken: rf } : {},
                rf ? { headers: { "x-refresh-token": rf } } : {},
            )
            .then((res) => {
                setAccessToken(res.data.accessToken);
                if (res.data.refreshToken) {
                    setRefreshToken(res.data.refreshToken);
                }
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
            | (InternalAxiosRequestConfig & { _retry?: boolean })
            | undefined;

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
