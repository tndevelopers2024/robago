// src/hooks/queries/useTaggedEntityQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import type { TaggedEntityDTO } from "@/types";

interface TaggedEntityApiLike<TCreate, TUpdate> {
    list(): Promise<TaggedEntityDTO[]>;
    create(input: TCreate): Promise<TaggedEntityDTO>;
    update(id: string, input: TUpdate): Promise<TaggedEntityDTO>;
    remove(id: string): Promise<void>;
}

export function createTaggedEntityQueries<TCreate, TUpdate>(
    queryKey: readonly unknown[],
    api: TaggedEntityApiLike<TCreate, TUpdate>,
    resourceLabel: string,
) {
    function useList() {
        return useQuery({
            queryKey,
            queryFn: () => api.list(),
            staleTime: 1000 * 60 * 5,
        });
    }

    function useCreate() {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (input: TCreate) => api.create(input),
            onError: (err) => toast.error(getErrorMessage(err, `Failed to create ${resourceLabel}.`)),
            onSuccess: () => toast.success(`${resourceLabel} created.`),
            onSettled: () => queryClient.invalidateQueries({ queryKey }),
        });
    }

    function useUpdate() {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, input }: { id: string; input: TUpdate }) => api.update(id, input),
            onError: (err) => toast.error(getErrorMessage(err, `Failed to update ${resourceLabel}.`)),
            onSuccess: () => toast.success(`${resourceLabel} updated.`),
            onSettled: () => queryClient.invalidateQueries({ queryKey }),
        });
    }

    function useDelete() {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: string) => api.remove(id),
            // robago-prd.md §8: "Can't delete. Dependent data exists." comes through as
            // the backend's 409 body and is surfaced verbatim by getErrorMessage.
            onError: (err) => toast.error(getErrorMessage(err, `Failed to delete ${resourceLabel}.`)),
            onSuccess: () => toast.success(`${resourceLabel} deleted.`),
            onSettled: () => queryClient.invalidateQueries({ queryKey }),
        });
    }

    return { useList, useCreate, useUpdate, useDelete };
}
