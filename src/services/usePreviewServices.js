import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../utils/invalidateQueries";

/** Unified nodes API for api_service and api_branch roles. */
const PREVIEW_SERVICES_PATH = "nodes";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const previewServicesClient = {
  getAll: () =>
    api.get(PREVIEW_SERVICES_PATH, {
      params: { role: "api_service", includeBranches: true },
    }),
  getById: (id) => api.get(`${PREVIEW_SERVICES_PATH}/${id}`),
  getByProjectId: (projectId) =>
    api.get(PREVIEW_SERVICES_PATH, {
      params: { projectId, role: "api_service", includeBranches: true },
    }),
  create: (data) => api.post(PREVIEW_SERVICES_PATH, { data }),
  update: (id, data) => api.patch(`${PREVIEW_SERVICES_PATH}/${id}`, data),
  deleteAll: async () => {
    const res = await api.get(PREVIEW_SERVICES_PATH, {
      params: { role: "api_service" },
    });
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    await Promise.all(rows.map((row) => api.delete(`${PREVIEW_SERVICES_PATH}/${row.id}`)));
    return { data: { message: "All preview services deleted" } };
  },
  deleteById: (id) => api.delete(`${PREVIEW_SERVICES_PATH}/${id}`),
};

export const usePreviewServicesCatalog = () => {
  return useQuery({
    queryKey: ["previewServicesCatalog"],
    queryFn: () => previewServicesClient.getAll(),
  });
};

export const usePreviewServicesByProjectId = (projectId) => {
  const { message } = App.useApp();
  const projectKey = queryKeyPart(projectId);
  return useQuery({
    queryKey: ["previewServicesByProject", projectKey],
    queryFn: async () => {
      const res = await previewServicesClient.getByProjectId(projectId);
      return { ...res, data: res?.data?.data ?? [] };
    },
    enabled: projectKey != null && projectKey !== "",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      console.error("Error fetching services:", error);
      message.error("Failed to load services");
    },
  });
};

export const usePreviewServiceById = (id, options = {}) => {
  const idKey = queryKeyPart(id);
  return useQuery({
    queryKey: ["previewServiceById", idKey],
    queryFn: () => previewServicesClient.getById(id),
    enabled:
      options.enabled !== undefined
        ? options.enabled
        : idKey != null && idKey !== "",
  });
};

export const useCreatePreviewService = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: previewServicesClient.create,
    onSuccess: async (_res, variables) => {
      const projectId = variables?.project_id ?? variables?.data?.project_id;
      const pk = queryKeyPart(projectId);
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ["previewServicesCatalog"],
        ["previewServicesByProject"],
        ...(pk != null ? [["previewServicesByProject", pk]] : []),
      );
      message.success("Service created");
    },
    onError: (error) => {
      console.error("Error creating preview service:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to create service";
      message.error(errorMessage);
    },
  });
};

export const useUpdatePreviewService = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, data }) => previewServicesClient.update(id, data),
    onSuccess: async (_res, variables) => {
      const projectId =
        variables?.data?.project_id ?? variables?.project_id ?? null;
      const pk = queryKeyPart(projectId);
      const nid = queryKeyPart(variables?.id);
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ["previewServicesCatalog"],
        ["previewServicesByProject"],
        ...(pk != null ? [["previewServicesByProject", pk]] : []),
        ...(nid != null
          ? [
              ["previewServiceById", nid],
              ["previewNode", nid],
              ["node", nid],
              ["nodeBuildHistory", nid],
            ]
          : []),
      );
      message.success("Service updated");
    },
    onError: (error) => {
      console.error("Error updating preview service:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update service";
      message.error(errorMessage);
    },
  });
};

export const useDeletePreviewService = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id) => previewServicesClient.deleteById(id),
    onSuccess: async (_data, id) => {
      const idK = queryKeyPart(id);
      if (idK != null) {
        queryClient.removeQueries({ queryKey: ["previewNode", idK] });
        queryClient.removeQueries({ queryKey: ["previewServiceById", idK] });
      }
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ["previewServicesCatalog"],
        ["previewServicesByProject"],
      );
      message.success("Preview service deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting preview service:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to delete preview service";
      message.error(errorMessage);
    },
  });
};

export const useDeleteAllPreviewServices = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: previewServicesClient.deleteAll,
    onSuccess: async () => {
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ["previewServicesCatalog"],
        ["previewServicesByProject"],
      );
      message.success("All preview services deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting all preview services:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to delete all preview services";
      message.error(errorMessage);
    },
  });
};

export const useImportPreviewServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      services,
      backendServices,
      projectId,
      userId,
      conflictResolution = "skip",
    }) => {
      const items = services ?? backendServices ?? [];
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}/ops/import/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backendServices: items,
            projectId,
            userId,
            conflictResolution,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import preview services");
      }

      return response.json();
    },
    onSuccess: async (data, variables) => {
      const pk = queryKeyPart(variables?.projectId);
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ["previewServicesCatalog"],
        ["previewServicesByProject"],
        ...(pk != null ? [["previewServicesByProject", pk]] : []),
      );
    },
  });
};

export const useExportPreviewServices = () => {
  return useMutation({
    mutationFn: async ({ projectId = null } = {}) => {
      const url = projectId
        ? `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}/ops/export/all?projectId=${encodeURIComponent(projectId)}`
        : `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}/ops/export/all`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export preview services");
      }

      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url_blob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url_blob;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "preview-services.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_blob);
      document.body.removeChild(a);

      return data;
    },
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branchData) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...branchData, role: "api_branch" }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create branch");
      }

      return response.json();
    },
    onSuccess: async (data, variables) => {
      const nid = queryKeyPart(variables?.node_id);
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ...(nid != null ? [["branches", nid]] : []),
        ["branches"],
        ["previewServicesByProject"],
        ["previewServicesCatalog"],
        ...(nid != null
          ? [
              ["previewNode", nid],
              ["previewServiceById", nid],
              ["node", nid],
            ]
          : []),
      );
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update branch");
      }

      return response.json();
    },
    onSuccess: async (data, variables) => {
      const nid = queryKeyPart(variables.data?.node_id ?? variables.node_id);
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ...(nid != null ? [["branches", nid]] : []),
        ["branches"],
        ["previewServicesByProject"],
        ["previewServicesCatalog"],
        ...(nid != null
          ? [
              ["previewNode", nid],
              ["previewServiceById", nid],
              ["node", nid],
            ]
          : []),
      );
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branchId) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}/${branchId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete branch");
      }

      return response.json();
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(
        queryClient,
        ["nodes"],
        ["node"],
        ["branches"],
        ["previewServicesByProject"],
        ["previewServicesCatalog"],
      );
    },
  });
};

export const useBranchesByNodeId = (nodeId) => {
  const nodeKey = queryKeyPart(nodeId);
  return useQuery({
    queryKey: ["branches", nodeKey],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${PREVIEW_SERVICES_PATH}?role=api_branch&parentNodeId=${encodeURIComponent(nodeId)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    },
    enabled: nodeKey != null && nodeKey !== "",
  });
};
