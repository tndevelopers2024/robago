import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockService } from "@/mocks/mock-service";
import type { TransactionType } from "@/types";
import { INVENTORY_QUERY_KEYS } from "./useInventory";
import { DASHBOARD_QUERY_KEYS } from "./useDashboard";
import { toast } from "sonner";

export const TRANSACTION_QUERY_KEYS = {
  all: ["transactions"] as const,
  list: (params: Record<string, unknown>) =>
    ["transactions", "list", params] as const,
};

export function useTransactionsList(params?: {
  page?: number;
  limit?: number;
  inventoryId?: string;
  type?: TransactionType;
}) {
  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.list(params || {}),
    queryFn: () => mockService.getTransactions(params),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      inventoryId: string;
      transactionType: TransactionType;
      quantity: number;
      producedBy?: string | null;
      consumedBy?: string | null;
      notes?: string | null;
    }) => mockService.createTransaction(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.detail(data.updatedItem.id),
      });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.metrics });
      toast.success(
        `Transaction recorded: ${data.transaction.transactionType} of ${data.transaction.quantity} units (New balance: ${data.updatedItem.quantity})`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post transaction");
    },
  });
}
