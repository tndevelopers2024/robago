import { useQuery } from "@tanstack/react-query";
import { mockService } from "@/mocks/mock-service";

export const DASHBOARD_QUERY_KEYS = {
  metrics: ["dashboard", "metrics"] as const,
  recentTransactions: ["dashboard", "recent-transactions"] as const,
};

export function useDashboardMetrics() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.metrics,
    queryFn: () => mockService.getDashboardMetrics(),
    refetchInterval: 15000, // Refresh dashboard values periodically
  });
}
