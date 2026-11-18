// src/lib/crm/store.ts
// School-visit data from the API. Lists refresh by themselves every 15 seconds, so when a colleague logs a visit from
// another town you see it (and who made it) without reloading. After any change, everything is re-read from the server.
import { useQuery } from "@tanstack/react-query";
import type { CreateSchoolInput, LogVisitInput, UpdateSchoolInput } from "@robago/shared";
import * as api from "@/api/crm";
import queryClient from "@/lib/queryClient";

const LIVE_MS = 15_000;
const live = { refetchInterval: LIVE_MS, refetchIntervalInBackground: false } as const;

export const crmKeys = {
    all: ["crm"] as const,
    list: (archived: boolean) => ["crm", "schools", archived] as const,
    detail: (id: string) => ["crm", "school", id] as const,
};

export function useSchools(archived = false) {
    return useQuery({ queryKey: crmKeys.list(archived), queryFn: () => api.getSchools(archived), ...live });
}
export function useSchoolDetail(id: string | null) {
    return useQuery({
        queryKey: crmKeys.detail(id ?? ""),
        queryFn: () => api.getSchool(id as string),
        enabled: Boolean(id),
        ...live,
    });
}

const refresh = () => queryClient.invalidateQueries({ queryKey: crmKeys.all });

export const crmActions = {
    async createSchool(input: CreateSchoolInput) {
        const r = await api.createSchool(input);
        await refresh();
        return r;
    },
    async updateSchool(id: string, input: UpdateSchoolInput) {
        const r = await api.updateSchool(id, input);
        await refresh();
        return r;
    },
    async logVisit(id: string, input: LogVisitInput) {
        const r = await api.logVisit(id, input);
        await refresh();
        return r;
    },
};
