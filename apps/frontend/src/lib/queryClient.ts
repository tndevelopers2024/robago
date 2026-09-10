// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30, // 30s default; overridden per-query in hooks/queries for slow-changing reference data
        },
        mutations: {
            retry: 0,
        },
    },
});

export default queryClient;
