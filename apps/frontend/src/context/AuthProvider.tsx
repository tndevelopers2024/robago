// src/context/AuthProvider.tsx
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as authApi from "@/api/auth";
import { setAccessToken } from "@/lib/authToken";import { onForcedLogout } from "@/lib/axiosInstance";
import queryClient from "@/lib/queryClient";
import type { UserDTO } from "@robago/shared";

type AuthContextValue = {
    isAuthenticated: boolean;
    user: UserDTO | null;
    isBootstrapping: boolean; // true during the initial silent-refresh attempt on app load
    isPending: boolean;
    login: (phoneNumber: string, passcode: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [isPending, setIsPending] = useState(false);

    // On first load there is no access token in memory (robago-prd.md §0/§4 — it's
    // deliberately never persisted to storage), so re-establish a session via the
    // httpOnly refresh cookie, then fetch the user. If that fails, the person is simply
    // logged out — this is the expected path for "never logged in" as much as "session
    // expired," so it fails silently rather than surfacing an error toast.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { accessToken } = await authApi.refreshSession();
                if (cancelled) return;
                setAccessToken(accessToken);
                const me = await authApi.fetchMe();
                if (cancelled) return;
                setUser(me);
            } catch {
                if (!cancelled) setUser(null);
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
            login: async (phoneNumber, passcode) => {
                setIsPending(true);
                try {
                    const { user: loggedInUser, accessToken } = await authApi.login({
                        phoneNumber,
                        passcode,
                    });
                    setAccessToken(accessToken);
                    setUser(loggedInUser);
                    navigate("/", { replace: true });
                } catch (err) {
                    // robago-prd.md §8: deliberately generic message, matching the
                    // backend's anti-enumeration choice (see services/auth.service.ts).
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
                    setAccessToken(null);
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
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
