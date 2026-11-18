// src/lib/accounts/store.ts
// Accounts data from the API. The lists refresh by themselves every 15 seconds, so when another admin records a
// payment you see it (and who made it) without reloading. After any change here, everything is re-read from the
// server — the balance is always the server's answer, never a local guess.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
    AccountKind,
    ActivityQuery,
    CreateAccountInput,
    CreateEntryInput,
    SendReminderInput,
    UpdateAccountInput,
    VoidEntryInput,
} from "@robago/shared";
import * as api from "@/api/accounts";
import queryClient from "@/lib/queryClient";

export const LIVE_MS = 15_000;

export const accountKeys = {
    all: ["accounts"] as const,
    list: (kind: AccountKind | "all", archived: boolean) => ["accounts", "list", kind, archived] as const,
    detail: (id: string) => ["accounts", "detail", id] as const,
    summary: () => ["accounts", "summary"] as const,
    activity: (q: Partial<ActivityQuery>) => ["accounts", "activity", q] as const,
};

const live = { refetchInterval: LIVE_MS, refetchIntervalInBackground: false } as const;

export function useAccounts(kind?: AccountKind, archived = false) {
    return useQuery({
        queryKey: accountKeys.list(kind ?? "all", archived),
        queryFn: () => api.getAccounts(kind, archived),
        ...live,
    });
}
export function useAccountDetail(id: string | null) {
    return useQuery({
        queryKey: accountKeys.detail(id ?? ""),
        queryFn: () => api.getAccount(id as string),
        enabled: Boolean(id),
        ...live,
    });
}
export function useAccountsSummary() {
    return useQuery({ queryKey: accountKeys.summary(), queryFn: api.getSummary, ...live });
}
export function useActivity(q: Partial<ActivityQuery>) {
    return useQuery({
        queryKey: accountKeys.activity(q),
        queryFn: () => api.getActivity(q),
        placeholderData: keepPreviousData,
        ...live,
    });
}

const refresh = () => queryClient.invalidateQueries({ queryKey: accountKeys.all });

export const accountActions = {
    async createAccount(input: CreateAccountInput) {
        const r = await api.createAccount(input);
        await refresh();
        return r;
    },
    async updateAccount(id: string, input: UpdateAccountInput) {
        const r = await api.updateAccount(id, input);
        await refresh();
        return r;
    },
    async addEntry(id: string, input: CreateEntryInput) {
        const r = await api.addEntry(id, input);
        await refresh();
        return r;
    },
    async voidEntry(entryId: string, input: VoidEntryInput) {
        const r = await api.voidEntry(entryId, input);
        await refresh();
        return r;
    },
    async sendReminder(id: string, input: SendReminderInput) {
        const r = await api.sendReminder(id, input);
        await refresh();
        return r;
    },
};
