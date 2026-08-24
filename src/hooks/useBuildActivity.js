import { useQuery } from "@tanstack/react-query";
import { api } from "../services/projectService";

/**
 * Fetches build activity time-series data from the backend.
 * @param {"24h"|"7d"|"30d"|"all"} range
 */
export function useBuildActivity(range = "7d") {
  return useQuery({
    queryKey: ["buildActivity", range],
    queryFn: async () => {
      const res = await api.get("stats/build-activity", { params: { range } });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,      // consider fresh for 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
