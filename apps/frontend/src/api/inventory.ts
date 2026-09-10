// src/api/inventory.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { CreateInventoryInput, UpdateInventoryInput } from "@robago/shared";
import type { InventoryAlertsResponse, InventoryDTO, InventoryDetailResponse } from "@/types";
import type { InventoryFilters } from "@/lib/queryKeys";

export async function getInventory(filters: InventoryFilters = {}): Promise<InventoryDTO[]> {
    const { data } = await axiosInstance.get<InventoryDTO[]>("/inventory", { params: filters });
    return data;
}

export async function getInventoryAlerts(): Promise<InventoryAlertsResponse> {
    const { data } = await axiosInstance.get<InventoryAlertsResponse>("/inventory/alerts");
    return data;
}

export async function getInventoryDetail(id: string): Promise<InventoryDetailResponse> {
    const { data } = await axiosInstance.get<InventoryDetailResponse>(`/inventory/${id}`);
    return data;
}

export async function createInventory(input: CreateInventoryInput): Promise<InventoryDTO> {
    const { data } = await axiosInstance.post<InventoryDTO>("/inventory", input);
    return data;
}

export async function updateInventory(
    id: string,
    input: UpdateInventoryInput,
): Promise<InventoryDTO> {
    const { data } = await axiosInstance.patch<InventoryDTO>(`/inventory/${id}`, input);
    return data;
}

export async function setInventoryImage(id: string, imgUrl: string): Promise<InventoryDTO> {
    const { data } = await axiosInstance.post<InventoryDTO>(`/inventory/${id}/image`, { imgUrl });
    return data;
}
