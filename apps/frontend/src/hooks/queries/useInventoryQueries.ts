// src/hooks/queries/useInventoryQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as inventoryApi from "@/api/inventory";
import { queryKeys, type InventoryFilters } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/errors";
import type { InventoryDTO } from "@/types";
import type { CreateInventoryInput, UpdateInventoryInput } from "@robago/shared";

export function useInventoryQuery(filters: InventoryFilters = {}) {
    return useQuery({
        queryKey: queryKeys.inventory.list(filters),
        queryFn: () => inventoryApi.getInventory(filters),
    });
}

export function useInventoryAlertsQuery() {
    return useQuery({
        queryKey: queryKeys.inventory.alerts(),
        queryFn: () => inventoryApi.getInventoryAlerts(),
    });
}

export function useInventoryDetailQuery(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.inventory.detail(id ?? ""),
        queryFn: () => inventoryApi.getInventoryDetail(id as string),
        enabled: Boolean(id),
    });
}

export function useCreateInventoryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateInventoryInput) => inventoryApi.createInventory(input),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to create inventory item.")),
        onSuccess: () => toast.success("Inventory item created."),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
}

export function useUpdateInventoryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateInventoryInput }) =>
            inventoryApi.updateInventory(id, input),
        onMutate: async ({ id, input }) => {
            const key = queryKeys.inventory.detail(id);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key);
            queryClient.setQueryData<{ inventory: InventoryDTO } | undefined>(key, (old) =>
                old ? { ...old, inventory: { ...old.inventory, ...input } as InventoryDTO } : old,
            );
            return { previous, key };
        },
        onError: (err, _vars, context) => {
            if (context) queryClient.setQueryData(context.key, context.previous);
            toast.error(getErrorMessage(err, "Failed to update inventory item."));
        },
        onSuccess: () => toast.success("Inventory item updated."),
        onSettled: (_data, _err, { id }) => {
            // Alert membership can flip when alertThreshold or quantity changes.
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.alerts() });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
}
