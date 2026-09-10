// src/api/products.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { CreateProductInput, UpdateProductInput } from "@robago/shared";
import type { ProductDTO } from "@/types";
import type { ProductFilters } from "@/lib/queryKeys";

export async function getProducts(filters: ProductFilters = {}): Promise<ProductDTO[]> {
    const { data } = await axiosInstance.get<ProductDTO[]>("/products", { params: filters });
    return data;
}

export async function createProduct(input: CreateProductInput): Promise<ProductDTO> {
    const { data } = await axiosInstance.post<ProductDTO>("/products", input);
    return data;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDTO> {
    const { data } = await axiosInstance.patch<ProductDTO>(`/products/${id}`, input);
    return data;
}

export async function deleteProduct(id: string): Promise<void> {
    await axiosInstance.delete(`/products/${id}`);
}
