// src/api/crm.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { CreateSchoolInput, LogVisitInput, SchoolDetailDTO, SchoolDTO, UpdateSchoolInput } from "@robago/shared";

export async function getSchools(archived = false): Promise<SchoolDTO[]> {
    return (await axiosInstance.get<SchoolDTO[]>("/crm/schools", { params: archived ? { archived: "true" } : {} }))
        .data;
}
export async function getSchool(id: string): Promise<SchoolDetailDTO> {
    return (await axiosInstance.get<SchoolDetailDTO>(`/crm/schools/${id}`)).data;
}
export async function createSchool(input: CreateSchoolInput): Promise<SchoolDTO> {
    return (await axiosInstance.post<SchoolDTO>("/crm/schools", input)).data;
}
export async function updateSchool(id: string, input: UpdateSchoolInput): Promise<SchoolDTO> {
    return (await axiosInstance.patch<SchoolDTO>(`/crm/schools/${id}`, input)).data;
}
export async function logVisit(id: string, input: LogVisitInput): Promise<SchoolDetailDTO> {
    return (await axiosInstance.post<SchoolDetailDTO>(`/crm/schools/${id}/visits`, input)).data;
}
