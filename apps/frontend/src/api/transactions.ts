// src/api/transactions.ts
import { axiosInstance } from "@/lib/axiosInstance";
import type { CreateTransactionInput, UpdateTransactionInput } from "@robago/shared";
import type { TransactionDTO } from "@/types";

export async function getInventoryTransactions(
    inventoryId: string,
    limit?: number,
): Promise<TransactionDTO[]> {
    const { data } = await axiosInstance.get<TransactionDTO[]>(
        `/inventory/${inventoryId}/transactions`,
        { params: { limit } },
    );
    return data;
}

export async function getRecentTransactions(limit = 20): Promise<TransactionDTO[]> {
    const { data } = await axiosInstance.get<TransactionDTO[]>("/transactions/recent", {
        params: { limit },
    });
    return data;
}

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionDTO> {
    const { data } = await axiosInstance.post<TransactionDTO>("/transactions", input);
    return data;
}

export async function updateTransaction(
    id: string,
    input: UpdateTransactionInput,
): Promise<TransactionDTO> {
    const { data } = await axiosInstance.patch<TransactionDTO>(`/transactions/${id}`, input);
    return data;
}
