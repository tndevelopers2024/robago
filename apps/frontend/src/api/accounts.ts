// src/api/accounts.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type {
    AccountDetailDTO,
    AccountDTO,
    AccountKind,
    AccountsSummaryDTO,
    ActivityPageDTO,
    ActivityQuery,
    CreateAccountInput,
    CreateEntryInput,
    EntryDTO,
    SendReminderInput,
    UpdateAccountInput,
    VoidEntryInput,
} from "@robago/shared";

export async function getAccounts(kind?: AccountKind, archived = false): Promise<AccountDTO[]> {
    return (
        await axiosInstance.get<AccountDTO[]>("/accounts", {
            params: { ...(kind ? { kind } : {}), ...(archived ? { archived: "true" } : {}) },
        })
    ).data;
}
export async function getAccount(id: string): Promise<AccountDetailDTO> {
    return (await axiosInstance.get<AccountDetailDTO>(`/accounts/${id}`)).data;
}
export async function getSummary(): Promise<AccountsSummaryDTO> {
    return (await axiosInstance.get<AccountsSummaryDTO>("/accounts/summary")).data;
}
export async function getActivity(q: Partial<ActivityQuery>): Promise<ActivityPageDTO> {
    return (await axiosInstance.get<ActivityPageDTO>("/accounts/activity", { params: q })).data;
}
export async function createAccount(input: CreateAccountInput): Promise<AccountDTO> {
    return (await axiosInstance.post<AccountDTO>("/accounts", input)).data;
}
export async function updateAccount(id: string, input: UpdateAccountInput): Promise<AccountDTO> {
    return (await axiosInstance.patch<AccountDTO>(`/accounts/${id}`, input)).data;
}
export async function addEntry(id: string, input: CreateEntryInput): Promise<EntryDTO> {
    return (await axiosInstance.post<EntryDTO>(`/accounts/${id}/entries`, input)).data;
}
export async function voidEntry(entryId: string, input: VoidEntryInput): Promise<EntryDTO> {
    return (await axiosInstance.post<EntryDTO>(`/accounts/entries/${entryId}/void`, input)).data;
}
export async function sendReminder(id: string, input: SendReminderInput) {
    return (
        await axiosInstance.post<{ channel: string; to: string; url?: string; messageId?: string }>(
            `/accounts/${id}/reminders`,
            input,
        )
    ).data;
}
