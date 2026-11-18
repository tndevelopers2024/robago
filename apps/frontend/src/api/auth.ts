// src/api/auth.ts
import { axiosInstance } from "@/lib/axiosInstance";
import { getRefreshToken } from "@/lib/authToken";
import type { LoginInput, UserDTO as SharedUserDTO } from "@robago/shared";

export interface LoginResponse {
    user: SharedUserDTO;
    accessToken: string;
    refreshToken?: string;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await axiosInstance.post<LoginResponse>("/auth/login", input);
    return data;
}

export async function logout(): Promise<void> {
    await axiosInstance.post("/auth/logout");
}

export async function fetchMe(): Promise<SharedUserDTO> {
    const { data } = await axiosInstance.get<SharedUserDTO>("/auth/me");
    return data;
}

export async function refreshSession(token?: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const rf = token || getRefreshToken();
    const { data } = await axiosInstance.post<{ accessToken: string; refreshToken?: string }>(
        "/auth/refresh",
        rf ? { refreshToken: rf } : {},
        rf ? { headers: { "x-refresh-token": rf } } : {},
    );
    return data;
}
