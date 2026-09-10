// src/lib/queryKeys.ts
export interface InventoryFilters {
    search?: string;
    warehouseId?: string;
    type?: string;
}
export interface ProductFilters {
    categoryId?: string;
    type?: string;
    search?: string;
}

export const queryKeys = {
    categories: {
        all: () => ["categories"] as const,
    },
    products: {
        list: (filters: ProductFilters = {}) => ["products", filters] as const,
    },
    warehouses: { all: () => ["warehouses"] as const },
    suppliers: { all: () => ["suppliers"] as const },
    productionUnits: { all: () => ["production-units"] as const },
    inventory: {
        list: (filters: InventoryFilters = {}) => ["inventory", filters] as const,
        alerts: () => ["inventory", "alerts"] as const,
        detail: (id: string) => ["inventory", id] as const,
        transactions: (id: string) => ["inventory", id, "transactions"] as const,
    },
    transactions: {
        recent: (limit: number) => ["transactions", "recent", { limit }] as const,
    },
    users: { all: () => ["users"] as const },
    auth: { me: () => ["auth", "me"] as const },
} as const;
