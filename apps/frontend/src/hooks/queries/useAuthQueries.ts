// src/hooks/queries/useAuthQueries.ts
import { useQuery } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import { queryKeys } from "@/lib/queryKeys";
import { getAccessToken } from "@/lib/authToken";

/** Only meaningful once AuthProvider has an access token in memory (post-login or
 *  post-silent-refresh) — see context/AuthProvider.tsx for the bootstrap sequence. */
export function useMeQuery() {
    return useQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: () => authApi.fetchMe(),
        enabled: Boolean(getAccessToken()),
        retry: false,
    });
}
