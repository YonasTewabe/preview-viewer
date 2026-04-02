import { useState, useEffect } from "react";
import { message, Modal } from "antd";
import axios from "axios";
import {
  loadBackendServicesFromFile,
  saveBackendServicesToFile,
  updateBackendServicesInFile,
  clearAllBackendServices,
  importBackendServicesFromFile,
  exportBackendServicesToFile,
} from "../utils/backendStorage";
import { appApiBase } from "../config/jenkins";

export function useBackendServices() {
  const [backendServices, setBackendServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savingServices, setSavingServices] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({
    stage: "",
    message: "",
    domainName: "",
    branchName: "",
  });

  // Load backend services from backendnodes.json on component mount
  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const loadedServices = await loadBackendServicesFromFile();
        setBackendServices(loadedServices);
      } catch (error) {
        console.error("Error loading backend services:", error);
        message.error("Failed to load backend services");
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  // Save backend services to file whenever services change
  useEffect(() => {
    if (backendServices.length > 0 && !loadingServices) {
      setSavingServices(true);
      updateBackendServicesInFile(backendServices).finally(() => {
        setSavingServices(false);
      });
    }
  }, [backendServices, loadingServices]);

  const handleAddService = (newServices) => {
    setBackendServices(newServices);
  };

  const handleEditService = (updatedServices) => {
    setBackendServices(updatedServices);
  };

  const handleDeleteService = (id) => {
    setBackendServices(backendServices.filter((service) => service.id !== id));
    message.success("Backend service deleted successfully");
  };

  const handleDeleteBranch = async (serviceId, branchId) => {
    try {
      // Find the branch to get its domain name
      const service = backendServices.find((s) => s.id === serviceId);
      const branch = service?.branches?.find((b) => b.id === branchId);
      console.log(service, branch, "serviceId,branchId");

      if (!branch || !branch.domainName) {
        message.error("Branch or domain name not found");
        return;
      }

      // Show delete progress modal
      setIsDeleteModalVisible(true);
      setDeleteProgress({
        stage: "deleting",
        message: "Deleting branch and domain...",
        domainName: branch.domainName,
        branchName: branch.name,
      });

      // Call Jenkins delete job
      console.log("Sending delete request for domain:", branch.domainName);
      const response = await axios.post(
        `${appApiBase()}jenkins/delete-preview-job`,
        {
          DOMAIN_NAME: branch.domainName,
        },
      );
      console.log("Jenkins delete response:", response.data);

      if (response.data.success) {
        console.log("Jenkins delete successful, removing branch from JSON");
        // Remove branch from JSON
        setBackendServices(
          backendServices.map((service) => {
            if (service.id === serviceId) {
              return {
                ...service,
                branches:
                  service.branches?.filter((b) => b.id !== branchId) || [],
              };
            }
            return service;
          })
        );

        // Update progress to completed
        setDeleteProgress({
          stage: "completed",
          message: "Branch and domain deleted successfully!",
          domainName: branch.domainName,
          branchName: branch.name,
        });

        // Close modal after 2 seconds
        setTimeout(() => {
          setIsDeleteModalVisible(false);
          setDeleteProgress({
            stage: "",
            message: "",
            domainName: "",
            branchName: "",
          });
        }, 2000);

        message.success(
          `Branch "${branch.name}" and domain "${branch.domainName}" deleted successfully`
        );
      } else {
        console.log("Jenkins delete failed:", response.data.message);
        // Update progress to failed
        setDeleteProgress({
          stage: "failed",
          message: `Failed to delete domain: ${response.data.message}`,
          domainName: branch.domainName,
          branchName: branch.name,
        });

        // Close modal after 3 seconds
        setTimeout(() => {
          setIsDeleteModalVisible(false);
          setDeleteProgress({
            stage: "",
            message: "",
            domainName: "",
            branchName: "",
          });
        }, 3000);

        message.error(`Failed to delete domain: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      // Update progress to error
      setDeleteProgress({
        stage: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete branch. Please try again.",
        domainName: branch?.domainName || "",
        branchName: branch?.name || "",
      });

      // Close modal after 3 seconds
      setTimeout(() => {
        setIsDeleteModalVisible(false);
        setDeleteProgress({
          stage: "",
          message: "",
          domainName: "",
          branchName: "",
        });
      }, 3000);

      message.error("Failed to delete branch. Please try again.");
    }
  };

  const handleAddBranch = (serviceId, newBranch) => {
    setBackendServices(
      backendServices.map((service) => {
        if (service.id === serviceId) {
          return {
            ...service,
            branches: [...(service.branches || []), newBranch],
          };
        }
        return service;
      })
    );
  };

  const exportToJson = () => {
    exportBackendServicesToFile(backendServices);
    message.success("JSON file exported successfully");
  };

  const saveToJsonFile = () => {
    exportBackendServicesToFile(backendServices);
    message.success("Backend services saved to JSON file successfully");
  };

  const saveToBackendNodes = async () => {
    try {
      const success = await saveBackendServicesToFile(backendServices);
      if (success) {
        message.success(
          "Backend services saved to backendnodes.json successfully"
        );
      } else {
        message.warning("Saved to localStorage (server unavailable)");
      }
    } catch (error) {
      console.error("Error saving to backendnodes.json:", error);
      message.error("Error saving to backendnodes.json");
    }
  };

  const importFromJson = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const importedServices = await importBackendServicesFromFile(file);
        setBackendServices(importedServices);
        message.success("JSON file imported successfully");
      } catch (error) {
        message.error(error.message || "Invalid JSON file");
      }
    }
  };

  const clearAllServices = async () => {
    await clearAllBackendServices();
    setBackendServices([]);
    message.success("All backend services cleared successfully");
  };

  return {
    backendServices,
    loadingServices,
    savingServices,
    isDeleteModalVisible,
    deleteProgress,
    setIsDeleteModalVisible,
    setDeleteProgress,
    handleAddService,
    handleEditService,
    handleDeleteService,
    handleDeleteBranch,
    handleAddBranch,
    exportToJson,
    saveToJsonFile,
    saveToBackendNodes,
    importFromJson,
    clearAllServices,
    setBackendServices,
  };
}
