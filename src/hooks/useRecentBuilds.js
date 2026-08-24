import { useQuery } from "@tanstack/react-query";
import { api } from "../services/projectService";

/**
 * Fetches paginated recent builds from NodeBuild history.
 * @param {{ page: number, limit: number, status: "all"|"passed"|"failed", q: string }} params
 */
export function useRecentBuilds({ page = 1, limit = 6, status = "all", q = "" } = {}) {
  return useQuery({
    queryKey: ["recentBuilds", page, limit, status, q],
    queryFn: async () => {
      const res = await api.get("stats/recent-builds", {
        params: { page, limit, status, q },
      });
      return res.data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 2,
  });
}
