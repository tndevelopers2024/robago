// src/api/users.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { CreateUserInput, UpdateUserInput } from "@robago/shared";
import type { UserDTO } from "@/types";

export async function getUsers(): Promise<UserDTO[]> {
    const { data } = await axiosInstance.get<UserDTO[]>("/users");
    return data;
}

export async function createUser(input: CreateUserInput): Promise<UserDTO> {
    const { data } = await axiosInstance.post<UserDTO>("/users", input);
    return data;
}

export async function updateUser(phoneNumber: string, input: UpdateUserInput): Promise<UserDTO> {
    const { data } = await axiosInstance.patch<UserDTO>(`/users/${phoneNumber}`, input);
    return data;
}

export async function deleteUser(phoneNumber: string): Promise<void> {
    await axiosInstance.delete(`/users/${phoneNumber}`);
}
