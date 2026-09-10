// src/api/auth.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { LoginInput, UserDTO as SharedUserDTO } from "@robago/shared";

export interface LoginResponse {
    user: SharedUserDTO;
    accessToken: string;
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

export async function refreshSession(): Promise<{ accessToken: string }> {
    const { data } = await axiosInstance.post<{ accessToken: string }>("/auth/refresh");
    return data;
}
