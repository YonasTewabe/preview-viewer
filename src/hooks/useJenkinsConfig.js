import { useQuery } from "@tanstack/react-query";
import { api } from "../services/projectService";

/**
 * Fetches the non-secret Jenkins config from the server (base URL + preview job name).
 * These values come from System Settings → Jenkins, not env vars.
 */
export function useJenkinsConfig() {
  return useQuery({
    queryKey: ["jenkinsPublicConfig"],
    queryFn: async () => {
      const res = await api.get("jenkins/public-config");
      return res.data; // { baseUrl: string|null, jobPreview: string|null }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
