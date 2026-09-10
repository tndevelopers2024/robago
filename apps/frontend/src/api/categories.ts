// src/api/categories.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { CreateCategoryInput, UpdateCategoryInput } from "@robago/shared";
import type { CategoryDTO } from "@/types";

export async function getCategories(type?: string): Promise<CategoryDTO[]> {
    const { data } = await axiosInstance.get<CategoryDTO[]>("/categories", { params: { type } });
    return data;
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryDTO> {
    const { data } = await axiosInstance.post<CategoryDTO>("/categories", input);
    return data;
}

export async function updateCategory(
    id: string,
    input: UpdateCategoryInput,
): Promise<CategoryDTO> {
    const { data } = await axiosInstance.patch<CategoryDTO>(`/categories/${id}`, input);
    return data;
}

export async function deleteCategory(id: string): Promise<void> {
    await axiosInstance.delete(`/categories/${id}`);
}
