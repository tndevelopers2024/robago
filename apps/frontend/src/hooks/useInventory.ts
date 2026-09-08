import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockService } from "@/mocks/mock-service";
import type { InventoryItem, ProductType } from "@/types";
import { DASHBOARD_QUERY_KEYS } from "./useDashboard";
import { toast } from "sonner";

export const INVENTORY_QUERY_KEYS = {
  all: ["inventory"] as const,
  list: (filters: Record<string, unknown>) =>
    ["inventory", "list", filters] as const,
  detail: (id: string) => ["inventory", "detail", id] as const,
  alerts: ["inventory", "alerts"] as const,
};

export function useInventoryList(params?: {
  type?: ProductType;
  search?: string;
  warehouseId?: string;
  categoryId?: string;
}) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.list(params || {}),
    queryFn: () => mockService.getInventory(params),
  });
}

export function useInventoryDetail(id: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.detail(id),
    queryFn: () => mockService.getInventoryById(id),
    enabled: Boolean(id),
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.alerts,
    queryFn: () => mockService.getInventoryAlerts(),
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<InventoryItem, "id" | "lastUpdated">) =>
      mockService.createStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.metrics });
      toast.success("Inventory stock entry created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create stock record");
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<InventoryItem>;
    }) => mockService.updateStock(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.detail(updated.id),
      });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.metrics });
      toast.success("Inventory parameters updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update stock record");
    },
  });
}
