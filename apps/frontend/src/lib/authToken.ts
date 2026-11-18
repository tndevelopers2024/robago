// src/lib/authToken.ts

const ACCESS_TOKEN_KEY = "robago_access_token";
const REFRESH_TOKEN_KEY = "robago_refresh_token";

let accessToken: string | null =
    typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
let refreshToken: string | null =
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

export function getAccessToken(): string | null {
    if (!accessToken && typeof window !== "undefined") {
        accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return accessToken;
}

export function setAccessToken(token: string | null): void {
    accessToken = token;
    if (typeof window !== "undefined") {
        if (token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
    }
}

export function getRefreshToken(): string | null {
    if (!refreshToken && typeof window !== "undefined") {
        refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return refreshToken;
}

export function setRefreshToken(token: string | null): void {
    refreshToken = token;
    if (typeof window !== "undefined") {
        if (token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    }
}

export function clearAuthTokens(): void {
    setAccessToken(null);
    setRefreshToken(null);
}
