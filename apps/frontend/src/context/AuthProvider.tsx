import React, { useEffect, useState } from "react";
import type { User } from "@/types";
import { mockService } from "@/mocks/mock-service";
import { onUnauthorized } from "@/lib/api-client";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial session verification (simulating GET /api/v1/auth/me)
    let mounted = true;

    async function checkAuth() {
      try {
        const sessionUser = await mockService.checkSession();
        if (mounted) {
          setUser(sessionUser);
        }
      } catch (err) {
        console.error("Session check error", err);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    // Subscribe to global 401 unauthorized events from Axios interceptor
    const unsubscribe = onUnauthorized(() => {
      setUser(null);
      toast.error("Session expired. Please sign in again.");
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (phoneNumber: string, passcode: string): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedInUser = await mockService.login(phoneNumber, passcode);
      setUser(loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.name}`);
      return loggedInUser;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Authentication failed";
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await mockService.logout();
      setUser(null);
      toast.info("Signed out successfully");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
