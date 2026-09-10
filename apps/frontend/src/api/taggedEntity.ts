// src/api/taggedEntity.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { TaggedEntityDTO } from "@/types";

export function createTaggedEntityApi<TCreate, TUpdate>(resourcePath: string) {
    return {
        async list(): Promise<TaggedEntityDTO[]> {
            const { data } = await axiosInstance.get<TaggedEntityDTO[]>(`/${resourcePath}`);
            return data;
        },
        async create(input: TCreate): Promise<TaggedEntityDTO> {
            const { data } = await axiosInstance.post<TaggedEntityDTO>(`/${resourcePath}`, input);
            return data;
        },
        async update(id: string, input: TUpdate): Promise<TaggedEntityDTO> {
            const { data } = await axiosInstance.patch<TaggedEntityDTO>(
                `/${resourcePath}/${id}`,
                input,
            );
            return data;
        },
        async remove(id: string): Promise<void> {
            await axiosInstance.delete(`/${resourcePath}/${id}`);
        },
    };
}
