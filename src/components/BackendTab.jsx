"use client";
import { useState } from "react";
import {
  Space,
  Button,
  message,
  Popconfirm,
  Spin,
  Empty,
  Form,
  Upload,
  Modal,
  Select,
  Radio,
  Alert,
  Divider,
  Input,
} from "antd";
import {
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import {
  useBackendNodes,
  useCreateBackendNodes,
  useUpdateBackendNode,
  useDeleteBackendNode,
  useBackendNodesByProjectId,
  useImportBackendServices,
  useExportBackendServices,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "../services/useBackendNodes";
import { useJenkins } from "../hooks/useJenkins";
import { useGitHub } from "../hooks/useGitHub";
import {
  jenkinsJobFolderUrl,
  JENKINS_JOB_BACKEND_PREVIEW,
} from "../config/jenkins";
import BackendServiceModal from "./BackendServiceModal";
import BranchModal from "./BranchModal";
import BuildProgressModal from "./BuildProgressModal";
import DeleteProgressModal from "./DeleteProgressModal";
import ServiceAccordion from "./ServiceAccordion";
import { useParams, useNavigate } from "react-router-dom";

const { Option } = Select;

export default function BackendTab({ project: projectProp } = {}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importForm] = Form.useForm();
  const [form] = Form.useForm();
  const [branchForm] = Form.useForm();
  const { id: idFromRoute } = useParams();
  const navigate = useNavigate();
  const projectId = projectProp?.id ?? idFromRoute;
  const project = projectProp;

  // React Query hooks
  const { data: backendServices = [], isLoading: loadingServices } =
    useBackendNodesByProjectId(projectId);
  const createBackendNode = useCreateBackendNodes();
  const updateBackendNode = useUpdateBackendNode();
  const deleteBackendNode = useDeleteBackendNode();
  const importBackendServices = useImportBackendServices();
  const exportBackendServices = useExportBackendServices();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  console.log(backendServices, "backendServices101");

  const {
    isBuildModalVisible,
    buildProgress,
    testJenkinsConnection,
    getBuildArtifacts,
    triggerJenkinsBuild,
    handleBuildModalCancel,
  } = useJenkins();

  const { githubBranches, loadingGithubBranches, fetchGithubBranches } =
    useGitHub();

  const handleAddServiceClick = () => {
    if (
      project &&
      (!project.env_name ||
        !project.environments ||
        project.environments.length === 0)
    ) {
      message.warning(
        "Set this project's environments before adding services.",
      );
      navigate(`/projects/${project.id}/environments`);
      return;
    }
    setEditingService(null);
    form.resetFields();
    form.setFieldsValue({
      type: "api",
    });
    setIsModalVisible(true);
  };

  const handleEditServiceClick = (service) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleServiceModalOk = async (updatedServices) => {
    try {
      if (editingService) {
        await updateBackendNode.mutateAsync({
          id: editingService.id,
          data: updatedServices,
        });
      } else {
        await createBackendNode.mutateAsync(updatedServices);
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error saving backend service:", error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await deleteBackendNode.mutateAsync(serviceId);
    } catch (error) {
      console.error("Error deleting backend service:", error);
    }
  };

  // Branch management functions
  const handleAddBranchClick = (serviceId) => {
    setSelectedServiceId(serviceId);
    branchForm.resetFields();
    setIsBranchModalVisible(true);
    console.log(serviceId, "serviceId");
    // Fetch GitHub branches for the selected service
    console.log({ backendServices }, "selectedService");

    const selectedService = backendServices?.data?.find(
      (service) => service.id === serviceId,
    );

    if (selectedService && selectedService.repository_name) {
      fetchGithubBranches(selectedService.repository_name);
    }
  };

  const handleBranchModalOk = () => {
    branchForm.validateFields().then(async (values) => {
      try {
        // Get the selected service to extract repository information
        const selectedService = backendServices?.data?.find(
          (service) => service.id === selectedServiceId,
        );
        console.log(
          { selectedServiceId, backendServices, selectedService },
          "selectedServiceId",
        );

        if (!selectedService) {
          message.error("Selected service not found");
          return;
        }

        // Check if branch already exists for this service
        const existingBranch = selectedService.branches?.find(
          (branch) => branch.name === values.name,
        );
        if (existingBranch) {
          message.error(
            `Branch "${values.name}" already exists for this service. Please choose a different branch.`,
          );
          return;
        }

        // Generate domain name and check for duplicates
        console.log(selectedService, "selectedService?.short_code");
        let branchNumber = values.name.match(/\d+/)?.[0];
        if (!branchNumber) {
          branchNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit number
        }
        const domainName = `${selectedService?.project?.short_code}-${branchNumber}-${selectedService?.id}`;
        const existingDomain = selectedService.branches?.find(
          (branch) => branch.domainName === domainName,
        );
        if (existingDomain) {
          message.error(
            `Domain "${domainName}" already exists. Please choose a different branch name.`,
          );
          return;
        }

        // Prepare Jenkins job parameters
        const jenkinsParams = {
          ENV_NAME: selectedService.env_name,
          REPO_URL: selectedService.repo_url,
          BRANCH_NAME: values.name,
          PORT: Math.floor(Math.random() * (8000 - 7000 + 1)) + 7000,
          DOMAIN_NAME: domainName,
          jenkins_job_url: jenkinsJobFolderUrl(JENKINS_JOB_BACKEND_PREVIEW),
        };

        // Create initial branch record in database with pending status
        const initialBranchData = {
          name: values.name,
          description: values.description,
          status: "active",
          domain_name: domainName,
          port: jenkinsParams.PORT,
          node_id: selectedServiceId,
          created_by: 1, // Replace with actual user ID from auth context
          build_result: "pending",
          jenkins_job_url: jenkinsParams.jenkins_job_url,
        };

        let createdBranch;
        try {
          createdBranch = await createBranch.mutateAsync(initialBranchData);
          message.success(`Branch "${values.name}" created and build started`);
        } catch (branchError) {
          console.error("Error creating branch record:", branchError);
          message.error(
            "Failed to create branch record. Build will not be tracked.",
          );
          return;
        }

        // Trigger Jenkins build with callbacks
        await triggerJenkinsBuild(
          jenkinsParams,
          // Success callback
          async (jenkinsData) => {
            try {
              console.log(jenkinsData, "jenkinsData success");

              // Update branch with success data
              const updateData = {
                build_number: jenkinsData.buildNumber,
                build_result: jenkinsData.result || "success",
                preview_link: jenkinsData.artifactData?.url,
                jenkins_job_url:
                  jenkinsData.jobUrl || jenkinsParams.jenkins_job_url,
              };

              await updateBranch.mutateAsync({
                id: createdBranch.id,
                data: updateData,
              });

              message.success(
                `Branch "${values.name}" build completed successfully`,
              );
            } catch (updateError) {
              console.error(
                "Error updating branch with success data:",
                updateError,
              );
              message.warning(
                "Branch created but failed to update build status",
              );
            }
          },
          // Error callback
          async (error) => {
            try {
              console.error("Jenkins build failed:", error);

              // Update branch with failure data
              const updateData = {
                build_result: "failed",
                jenkins_job_url: jenkinsParams.jenkins_job_url,
              };

              await updateBranch.mutateAsync({
                id: createdBranch.id,
                data: updateData,
              });

              message.error(`Branch "${values.name}" build failed`);
            } catch (updateError) {
              console.error(
                "Error updating branch with failure data:",
                updateError,
              );
              message.warning(
                "Branch created but failed to update build status",
              );
            }
          },
        );

        setIsBranchModalVisible(false);
        branchForm.resetFields();
      } catch (error) {
        console.error("Error creating branch:", error);
        message.error("Failed to create branch");
      }
    });
  };

  const handleBranchModalCancel = () => {
    setIsBranchModalVisible(false);
    branchForm.resetFields();
  };

  const handleDeleteBranch = async (serviceId, branchId) => {
    try {
      // Find the branch to get its domain name
      const selectedService = backendServices?.data?.find(
        (service) => service.id === serviceId,
      );
      const branch = selectedService?.branches?.find((b) => b.id === branchId);

      if (!branch || !branch.domain_name) {
        message.error("Branch or domain name not found");
        return;
      }

      console.log(
        "Deleting branch:",
        branch.name,
        "with domain:",
        branch.domain_name,
      );

      // First, delete the branch from the database
      message.success(`Branch "${branch.name}" deleted from database`);

      // Then, call Jenkins to delete the domain
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}jenkins/delete-preview-job`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              DOMAIN_NAME: branch.domain_name,
            }),
          },
        );

        const result = await response.json();

        if (result.success) {
          message.success(
            `Domain "${branch.domain_name}" deleted successfully from Jenkins`,
          );

          // After successful Jenkins deletion, call handleDeleteService
          await deleteBranch.mutateAsync(branchId);
        } else {
          message.warning(
            `Branch deleted from database but failed to delete domain: ${result.message}`,
          );
          // Even if Jenkins deletion fails, we still want to delete the service
          await deleteBranch.mutateAsync(branchId);
        }
      } catch (jenkinsError) {
        console.error("Jenkins deletion error:", jenkinsError);
        message.warning(
          `Branch deleted from database but failed to delete domain. Proceeding with service deletion.`,
        );
        // Continue with service deletion even if Jenkins fails
        await handleDeleteService(serviceId);
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      message.error("Failed to delete branch");
    }
  };

  const handleRebuildBranch = async (serviceId, branchId, branchName) => {
    try {
      // Find the selected service and branch
      const selectedService = backendServices?.data?.find(
        (service) => service.id === serviceId,
      );
      const branch = selectedService?.branches?.find((b) => b.id === branchId);

      if (!branch || !selectedService) {
        message.error("Branch or service not found");
        return;
      }

      // Update branch status to pending
      await updateBranch.mutateAsync({
        id: branchId,
        data: {
          build_result: "pending",
        },
      });

      // Prepare Jenkins job parameters for rebuild
      const jenkinsParams = {
        ENV_NAME: selectedService.env_name,
        REPO_URL: selectedService.repo_url,
        BRANCH_NAME: branch.name,
        PORT:
          branch.port || Math.floor(Math.random() * (8000 - 7000 + 1)) + 7000,
        DOMAIN_NAME: branch.domain_name,
        jenkins_job_url: jenkinsJobFolderUrl(JENKINS_JOB_BACKEND_PREVIEW),
      };

      // Trigger Jenkins build with callbacks
      await triggerJenkinsBuild(
        jenkinsParams,
        // Success callback
        async (jenkinsData) => {
          try {
            console.log(jenkinsData, "jenkinsData success rebuild");

            // Update branch with success data
            const updateData = {
              build_number: jenkinsData.buildNumber,
              build_result: jenkinsData.result || "success",
              preview_link: jenkinsData.artifactData?.url,
              jenkins_job_url:
                jenkinsData.jobUrl || jenkinsParams.jenkins_job_url,
            };

            await updateBranch.mutateAsync({
              id: branchId,
              data: updateData,
            });

            message.success(
              `Branch "${branchName}" rebuild completed successfully`,
            );
          } catch (updateError) {
            console.error(
              "Error updating branch with success data:",
              updateError,
            );
            message.warning(
              "Branch rebuild completed but failed to update build status",
            );
          }
        },
        // Error callback
        async (error) => {
          try {
            console.error("Jenkins rebuild failed:", error);

            // Update branch with failure data
            const updateData = {
              build_result: "failed",
              jenkins_job_url: jenkinsParams.jenkins_job_url,
            };

            await updateBranch.mutateAsync({
              id: branchId,
              data: updateData,
            });

            message.error(`Branch "${branchName}" rebuild failed`);
          } catch (updateError) {
            console.error(
              "Error updating branch with failure data:",
              updateError,
            );
            message.warning(
              "Branch rebuild failed but failed to update build status",
            );
          }
        },
      );

      message.success(`Rebuild started for branch "${branchName}"`);
    } catch (error) {
      console.error("Error starting rebuild:", error);
      message.error("Failed to start rebuild");
    }
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      api: "blue",
      database: "purple",
      cache: "orange",
      queue: "red",
      auth: "green",
      storage: "cyan",
    };
    return colors[type] || "default";
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("Repository URL copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        message.error("Failed to copy repository URL.");
      });
  };

  const handleImportJson = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Importing file:", file.name, file.size);
      try {
        // This would need to be implemented with proper API calls
        message.success(`Importing ${file.name}...`);
      } catch (error) {
        console.error("Import error:", error);
        message.error("Failed to import JSON file");
      }
      // Reset the input value so the same file can be selected again
      event.target.value = "";
    } else {
      message.warning("No file selected");
    }
  };

  const handleImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        console.log(jsonData, "jsonData");
        if (jsonData.backendServices && jsonData.backendServices.length > 0) {
          console.log(
            jsonData.backendServices,
            "jsonData inside handleImportFile",
          );
          // This would need to be implemented with proper API calls
          message.success(`Imported ${file.name} successfully.`);
          setIsImportModalVisible(false);
        } else {
          message.error("Invalid file format: backendServices array not found");
        }
      } catch (error) {
        console.error("Failed to parse JSON file:", error);
        message.error(
          "Failed to parse JSON file. Please ensure it is a valid JSON file.",
        );
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      message.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (values) => {
    try {
      const { conflictResolution, backendServices } = values;

      // Get current user ID (you might need to get this from your auth context)
      const userId = 1; // Replace with actual user ID

      const result = await importBackendServices.mutateAsync({
        backendServices,
        projectId: parseInt(String(projectId), 10),
        userId,
        conflictResolution,
      });

      message.success(result.message);

      // Show detailed results
      if (result.details) {
        const { imported, updated, skipped, errors } = result.details.summary;
        let detailsMessage = `Import completed: ${imported} imported, ${updated} updated, ${skipped} skipped`;
        if (errors > 0) {
          detailsMessage += `, ${errors} errors`;
        }
        message.info(detailsMessage);
      }

      setIsImportModalVisible(false);
      importForm.resetFields();
    } catch (error) {
      console.error("Import error:", error);
      message.error(error.message || "Failed to import backend services");
    }
  };

  const handleExportServices = async () => {
    try {
      await exportBackendServices.mutateAsync({
        projectId: parseInt(String(projectId), 10),
      });
      message.success("Backend services exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      message.error(error.message || "Failed to export backend services");
    }
  };

  const handleExportAllServices = async () => {
    try {
      await exportBackendServices.mutateAsync();
      message.success("All backend services exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      message.error(error.message || "Failed to export all backend services");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddServiceClick}
            style={{
              backgroundColor: "#3b82f6",
              borderColor: "#3b82f6",
            }}
          >
            Add service
          </Button>

          <Button
            icon={<ImportOutlined />}
            onClick={() => setIsImportModalVisible(true)}
            style={{
              borderColor: "#10b981",
              color: "#10b981",
            }}
          >
            Import Services
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportServices}
            style={{
              borderColor: "#8b5cf6",
              color: "#8b5cf6",
            }}
          >
            Export Project Services
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportAllServices}
            style={{
              borderColor: "#f59e0b",
              color: "#f59e0b",
            }}
          >
            Export All Services
          </Button>
        </Space>
      </div>

      {loadingServices ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <Spin size="large" tip="Loading services..." />
        </div>
      ) : backendServices?.data.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
          }}
        >
          <Empty description="No services yet. Use &quot;Add service&quot; to create one." />
        </div>
      ) : (
        <ServiceAccordion
          backendServices={backendServices?.data}
          onEditService={handleEditServiceClick}
          onDeleteService={handleDeleteService}
          onAddBranch={handleAddBranchClick}
          onDeleteBranch={handleDeleteBranch}
          onGetBuildArtifacts={getBuildArtifacts}
          onRebuildBranch={handleRebuildBranch}
          getServiceTypeColor={getServiceTypeColor}
        />
      )}

      {/* Backend Service Modal */}
      <BackendServiceModal
        isVisible={isModalVisible}
        editingService={editingService}
        backendServices={backendServices}
        onOk={handleServiceModalOk}
        onCancel={handleModalCancel}
        form={form}
        projectId={projectId}
      />

      {/* Branch Modal */}
      <BranchModal
        isVisible={isBranchModalVisible}
        onOk={handleBranchModalOk}
        onCancel={handleBranchModalCancel}
        form={branchForm}
        githubBranches={githubBranches}
        loadingGithubBranches={loadingGithubBranches}
      />

      {/* Build Progress Modal */}
      <BuildProgressModal
        isVisible={isBuildModalVisible}
        buildProgress={buildProgress}
        onCancel={handleBuildModalCancel}
      />

      {/* Import Modal */}
      <Modal
        title="Import services"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={importForm} layout="vertical" onFinish={handleImportSubmit}>
          <Alert
            message="Import Instructions"
            description="Upload a JSON file containing backend services. The file should have a 'backendServices' array with service objects."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="conflictResolution"
            label="Conflict Resolution"
            initialValue="skip"
            rules={[
              {
                required: true,
                message: "Please select conflict resolution strategy",
              },
            ]}
          >
            <Radio.Group>
              <Radio value="skip">Skip existing services</Radio>
              <Radio value="update">Update existing services</Radio>
              <Radio value="overwrite">Overwrite existing services</Radio>
            </Radio.Group>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Upload.Dragger
              name="file"
              accept=".json"
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const jsonData = JSON.parse(event.target.result);
                    console.log(jsonData, "jsonData inside handleImportFile");
                    if (
                      jsonData.backendServices &&
                      Array.isArray(jsonData.backendServices)
                    ) {
                      importForm.setFieldsValue({
                        backendServices: jsonData.backendServices,
                      });
                      message.success(
                        `File "${file.name}" loaded successfully. Found ${jsonData.backendServices.length} services.`,
                      );
                    } else {
                      message.error(
                        "Invalid file format: backendServices array not found",
                      );
                    }
                  } catch (error) {
                    console.error("Failed to parse JSON file:", error);
                    message.error(
                      "Failed to parse JSON file. Please ensure it is a valid JSON file.",
                    );
                  }
                };
                reader.onerror = (error) => {
                  console.error("Error reading file:", error);
                  message.error("Failed to read file.");
                };
                reader.readAsText(file);
                return false; // Prevent default upload behavior
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined
                  style={{ fontSize: "48px", color: "#1890ff" }}
                />
              </p>
              <p className="ant-upload-text">
                Click or drag JSON file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single JSON file with backend services data
              </p>
            </Upload.Dragger>
          </div>

          <Form.Item
            name="backendServices"
            rules={[
              {
                required: true,
                message: "Please upload a JSON file with backend services",
              },
            ]}
            style={{ display: "none" }}
          >
            <Input />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsImportModalVisible(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={importBackendServices.isPending}
                disabled={!importForm.getFieldValue("backendServices")}
              >
                Import Services
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
