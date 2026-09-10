// src/hooks/queries/useProductsQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as productsApi from "@/api/products";
import { queryKeys, type ProductFilters } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/errors";
import type { CreateProductInput, UpdateProductInput } from "@robago/shared";

export function useProductsQuery(filters: ProductFilters = {}) {
    return useQuery({
        queryKey: queryKeys.products.list(filters),
        queryFn: () => productsApi.getProducts(filters),
    });
}

export function useCreateProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateProductInput) => productsApi.createProduct(input),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to create product.")),
        onSuccess: () => toast.success("Product created."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });
}

export function useUpdateProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
            productsApi.updateProduct(id, input),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to update product.")),
        onSuccess: () => toast.success("Product updated."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });
}

export function useDeleteProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => productsApi.deleteProduct(id),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to delete product.")),
        onSuccess: () => toast.success("Product deleted."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    });
}
