// src/hooks/queries/useCategoriesQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as categoriesApi from "@/api/categories";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/errors";
import type { CategoryDTO } from "@/types";
import type { CreateCategoryInput, UpdateCategoryInput } from "@robago/shared";

export function useCategoriesQuery(type?: string) {
    return useQuery({
        queryKey: queryKeys.categories.all(),
        queryFn: () => categoriesApi.getCategories(type),
        staleTime: 1000 * 60 * 5, // reference data changes rarely
    });
}

export function useCreateCategoryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateCategoryInput) => categoriesApi.createCategory(input),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.categories.all() });
            const previous = queryClient.getQueryData<CategoryDTO[]>(queryKeys.categories.all());
            const optimistic: CategoryDTO = { _id: `optimistic-${Date.now()}`, ...input } as CategoryDTO;
            queryClient.setQueryData<CategoryDTO[]>(queryKeys.categories.all(), (old) => [
                ...(old ?? []),
                optimistic,
            ]);
            return { previous };
        },
        onError: (err, _input, context) => {
            queryClient.setQueryData(queryKeys.categories.all(), context?.previous);
            toast.error(getErrorMessage(err, "Failed to create category."));
        },
        onSuccess: () => toast.success("Category created."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() }),
    });
}

export function useUpdateCategoryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
            categoriesApi.updateCategory(id, input),
        onMutate: async ({ id, input }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.categories.all() });
            const previous = queryClient.getQueryData<CategoryDTO[]>(queryKeys.categories.all());
            queryClient.setQueryData<CategoryDTO[]>(queryKeys.categories.all(), (old) =>
                old?.map((c) => (c._id === id ? { ...c, ...input } : c)),
            );
            return { previous };
        },
        onError: (err, _vars, context) => {
            queryClient.setQueryData(queryKeys.categories.all(), context?.previous);
            toast.error(getErrorMessage(err, "Failed to update category."));
        },
        onSuccess: () => toast.success("Category updated."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() }),
    });
}

export function useDeleteCategoryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => categoriesApi.deleteCategory(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.categories.all() });
            const previous = queryClient.getQueryData<CategoryDTO[]>(queryKeys.categories.all());
            queryClient.setQueryData<CategoryDTO[]>(queryKeys.categories.all(), (old) =>
                old?.filter((c) => c._id !== id),
            );
            return { previous };
        },
        onError: (err, _id, context) => {
            queryClient.setQueryData(queryKeys.categories.all(), context?.previous);
            // robago-prd.md §8: the legacy app's exact dependency-block message, surfaced
            // by the backend as a 409 — pass it through verbatim rather than a generic one.
            toast.error(getErrorMessage(err, "Failed to delete category."));
        },
        onSuccess: () => toast.success("Category deleted."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() }),
    });
}
