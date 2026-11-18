// src/context/AuthProvider.tsx
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as authApi from "@/api/auth";
import {
    getAccessToken,
    setAccessToken,
    setRefreshToken,
    clearAuthTokens,
} from "@/lib/authToken";
import { onForcedLogout } from "@/lib/axiosInstance";
import queryClient from "@/lib/queryClient";
import { can as roleCan, type Permission, type UserDTO } from "@robago/shared";

type AuthContextValue = {
    isAuthenticated: boolean;
    user: UserDTO | null;
    isBootstrapping: boolean; // true during the initial silent-refresh attempt on app load
    isPending: boolean;
    login: (phoneNumber: string, passcode: string) => Promise<void>;
    logout: () => Promise<void>;
    /** Does the signed-in person's role include this permission? */
    can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [isPending, setIsPending] = useState(false);

    // On app load or page refresh, restore the active session.
    // 1. If an access token is already saved, use it directly to fetch the current user.
    // 2. If missing or expired, attempt a silent token refresh (via httpOnly cookie or stored refresh token).
    // 3. Only if both fail is the user considered logged out.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const token = getAccessToken();
            if (token) {
                try {
                    const me = await authApi.fetchMe();
                    if (!cancelled) {
                        setUser(me);
                        setIsBootstrapping(false);
                        return;
                    }
                } catch {
                    // Access token may be expired; continue to silent refresh below.
                }
            }

            try {
                const { accessToken, refreshToken } = await authApi.refreshSession();
                if (cancelled) return;
                setAccessToken(accessToken);
                if (refreshToken) setRefreshToken(refreshToken);
                const me = await authApi.fetchMe();
                if (cancelled) return;
                setUser(me);
            } catch {
                if (!cancelled) {
                    clearAuthTokens();
                    setUser(null);
                }
            } finally {
                if (!cancelled) setIsBootstrapping(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return onForcedLogout(() => {
            clearAuthTokens();
            setUser(null);
            queryClient.clear();
            navigate("/auth/login", { replace: true });
        });
    }, [navigate]);

    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: Boolean(user),
            user,
            isBootstrapping,
            isPending,
            can: (permission) => roleCan(user?.role, permission),
            login: async (phoneNumber, passcode) => {
                setIsPending(true);
                try {
                    const { user: loggedInUser, accessToken, refreshToken } = await authApi.login({
                        phoneNumber,
                        passcode,
                    });
                    setAccessToken(accessToken);
                    if (refreshToken) setRefreshToken(refreshToken);
                    setUser(loggedInUser);
                    navigate("/", { replace: true });
                } catch (err) {
                    toast.error("Invalid phone number or passcode");
                    throw err;
                } finally {
                    setIsPending(false);
                }
            },
            logout: async () => {
                try {
                    await authApi.logout();
                } finally {
                    clearAuthTokens();
                    setUser(null);
                    queryClient.clear();
                    navigate("/auth/login", { replace: true });
                }
            },
        }),
        [user, isBootstrapping, isPending, navigate],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};
