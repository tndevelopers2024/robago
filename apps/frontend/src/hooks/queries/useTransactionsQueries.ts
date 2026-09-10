// src/hooks/queries/useTransactionsQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as transactionsApi from "@/api/transactions";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/errors";
import type { InventoryDetailResponse } from "@/types";
import type { CreateTransactionInput, TransactionType, UpdateTransactionInput } from "@robago/shared";

// Mirrors apps/backend/src/utils/transactionMath.ts's sign convention exactly — kept in
// sync by naming and by the shared PRD reference, since the frontend needs it too for
// the optimistic patch (the real, authoritative delta is still computed server-side).
function signForTransactionType(type: TransactionType): 1 | -1 {
    return type === "Consumption" || type === "Sale" ? -1 : 1;
}

export function useInventoryTransactionsQuery(inventoryId: string | undefined, limit?: number) {
    return useQuery({
        queryKey: queryKeys.inventory.transactions(inventoryId ?? ""),
        queryFn: () => transactionsApi.getInventoryTransactions(inventoryId as string, limit),
        enabled: Boolean(inventoryId),
    });
}

export function useRecentTransactionsQuery(limit = 20) {
    return useQuery({
        queryKey: queryKeys.transactions.recent(limit),
        queryFn: () => transactionsApi.getRecentTransactions(limit),
    });
}

export function useCreateTransactionMutation(inventoryId: string) {
    const queryClient = useQueryClient();
    const detailKey = queryKeys.inventory.detail(inventoryId);

    return useMutation({
        mutationFn: (input: CreateTransactionInput) => transactionsApi.createTransaction(input),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: detailKey });
            const previous = queryClient.getQueryData<InventoryDetailResponse>(detailKey);
            const delta = signForTransactionType(input.transactionType) * input.quantity;
            queryClient.setQueryData<InventoryDetailResponse | undefined>(detailKey, (old) =>
                old
                    ? { ...old, inventory: { ...old.inventory, quantity: old.inventory.quantity + delta } }
                    : old,
            );
            return { previous };
        },
        onError: (err, _input, context) => {
            if (context) queryClient.setQueryData(detailKey, context.previous);
            toast.error(getErrorMessage(err, "Failed to log transaction."));
        },
        onSuccess: () => toast.success("Transaction logged."),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: detailKey });
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions(inventoryId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.alerts() });
        },
    });
}

export function useUpdateTransactionMutation(inventoryId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
            transactionsApi.updateTransaction(id, input),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to update transaction.")),
        onSuccess: () => toast.success("Transaction updated."),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(inventoryId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions(inventoryId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.alerts() });
        },
    });
}
