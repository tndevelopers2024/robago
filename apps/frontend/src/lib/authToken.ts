// src/lib/authToken.ts
//
// robago-prd.md §0/§4: the legacy app stored the entire user record (including the
// password hash) in unencrypted local storage as its "session." The rebuild's access
// token lives in memory only — it's gone on tab close/refresh, and a silent refresh
// (via the httpOnly refresh cookie) re-establishes it. This module is the one place
// that memory lives, so both the Axios interceptor (outside the React tree) and
// AuthContext (inside it) read/write the same value without prop-drilling a setter
// through the interceptor.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
    return accessToken;
}

export function setAccessToken(token: string | null): void {
    accessToken = token;
}
