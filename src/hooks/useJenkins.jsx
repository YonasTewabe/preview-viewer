import { useState } from "react";
import { message, Modal } from "antd";
import axios from "axios";
import { appApiBase } from "../config/jenkins";

export function useJenkins() {
  const [isBuildModalVisible, setIsBuildModalVisible] = useState(false);
  const [buildProgress, setBuildProgress] = useState({
    stage: "",
    message: "",
    buildNumber: null,
    result: null,
    artifactData: null,
    consoleLog: "",
  });

  // Test Jenkins connection
  const testJenkinsConnection = async () => {
    try {
      const response = await axios.get(`${appApiBase()}jenkins/test-connection`);
      if (response.data.success) {
        message.success("Jenkins connection successful!");
      } else {
        message.error("Jenkins connection failed");
      }
    } catch (error) {
      console.error("Jenkins connection test failed:", error);
      message.error("Failed to connect to Jenkins server");
    }
  };

  // Get console logs
  const getConsoleLogs = async (buildNumber) => {
    try {
      const response = await axios.get(
        `${appApiBase()}jenkins/console-logs/${buildNumber}`,
      );
      if (response.data.success) {
        return response.data.consoleLog;
      } else {
        return "Console logs not available";
      }
    } catch (error) {
      console.error("Error getting console logs:", error);
      return "Failed to fetch console logs";
    }
  };

  // Get build artifacts
  const getBuildArtifacts = async (buildNumber) => {
    try {
      const response = await axios.get(
        `${appApiBase()}jenkins/build-artifacts/${buildNumber}`,
      );
      if (response.data.success) {
        const { artifacts, buildInfo } = response.data;

        // Create a modal to display the artifacts
        Modal.info({
          title: `Build #${buildNumber} Artifacts`,
          width: 800,
          content: (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontWeight: "bold" }}>Build Information:</span>
                <br />
                <span style={{ color: "#666" }}>
                  Duration: {Math.round(buildInfo.duration / 1000)}s |
                  Timestamp: {new Date(buildInfo.timestamp).toLocaleString()}
                </span>
              </div>

              {artifacts.successResponse && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                    ✅ Success Response:
                  </span>
                  <pre
                    style={{
                      backgroundColor: "#f6ffed",
                      padding: "8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(artifacts.successResponse, null, 2)}
                  </pre>
                </div>
              )}

              {artifacts.errorResponse && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontWeight: "bold", color: "#ff4d4f" }}>
                    ❌ Error Response:
                  </span>
                  <pre
                    style={{
                      backgroundColor: "#fff2f0",
                      padding: "8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(artifacts.errorResponse, null, 2)}
                  </pre>
                </div>
              )}

              {artifacts.otherArtifacts.length > 0 && (
                <div>
                  <span style={{ fontWeight: "bold" }}>
                    📁 Other Artifacts:
                  </span>
                  <ul style={{ fontSize: "12px" }}>
                    {artifacts.otherArtifacts.map((artifact, index) => (
                      <li key={index}>
                        {artifact.relativePath} ({artifact.size} bytes)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!artifacts.successResponse &&
                !artifacts.errorResponse &&
                artifacts.otherArtifacts.length === 0 && (
                  <span style={{ color: "#666" }}>
                    No artifacts found for this build.
                  </span>
                )}
            </div>
          ),
        });
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error("Error getting build artifacts:", error);
      if (error.response?.status === 202) {
        message.warning("Build is still running. Please try again later.");
      } else if (error.response?.status === 404) {
        message.error("Build not found.");
      } else {
        message.error("Failed to get build artifacts.");
      }
    }
  };

  // Trigger Jenkins build
  const triggerJenkinsBuild = async (jenkinsParams, onSuccess, onError) => {
    try {
      // Show build progress modal
      setIsBuildModalVisible(true);
      setBuildProgress({
        stage: "triggering",
        message: "Triggering Jenkins build...",
        buildNumber: null,
        result: null,
        artifactData: null,
      });

      // Trigger Jenkins job through our server proxy to avoid CORS issues
      const jenkinsResponse = await axios.post(
        `${appApiBase()}jenkins/trigger-preview-job`,
        jenkinsParams,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Server proxy returns success/error in response data
      if (jenkinsResponse.data.success) {
        // Fetch console logs
        const consoleLog = await getConsoleLogs(
          jenkinsResponse.data.buildNumber
        );

        // Update build progress with success
        setBuildProgress({
          stage: "completed",
          message: "Build completed successfully!",
          buildNumber: jenkinsResponse.data.buildNumber,
          result: jenkinsResponse.data.result,
          artifactData: jenkinsResponse.data.artifactData,
          consoleLog: consoleLog,
        });

        // Call success callback
        if (onSuccess) {
          onSuccess(jenkinsResponse.data);
        }
      } else {
        // Fetch console logs for failed build
        const consoleLog = jenkinsResponse.data.buildNumber
          ? await getConsoleLogs(jenkinsResponse.data.buildNumber)
          : "Console logs not available";

        // Update build progress with error
        setBuildProgress({
          stage: "failed",
          message: `Build failed: ${jenkinsResponse.data.message}`,
          buildNumber: jenkinsResponse.data.buildNumber,
          result: jenkinsResponse.data.result,
          artifactData: null,
          consoleLog: consoleLog,
        });

        // Call error callback
        if (onError) {
          onError(jenkinsResponse.data);
        }
      }
    } catch (error) {
      console.error("Error creating branch:", error);

      // Update build progress with error
      setBuildProgress({
        stage: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred",
        buildNumber: null,
        result: "ERROR",
        artifactData: null,
      });

      // Call error callback
      if (onError) {
        onError(error);
      }
    }
  };
  const triggerJenkinsFrontBuild = async (jenkinsParams, onSuccess, onError) => {
    try {
      // Show build progress modal
      setIsBuildModalVisible(true);
      setBuildProgress({
        stage: "triggering",
        message: "Triggering Jenkins Rebuild...",
        buildNumber: null,
        result: null,
        artifactData: null,
      });

      // Trigger Jenkins job through our server proxy to avoid CORS issues
      const jenkinsResponse = await axios.post(
        `${appApiBase()}jenkins/trigger-frontend-job`,
        jenkinsParams,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Server proxy returns success/error in response data
      if (jenkinsResponse.data.success) {
        // Fetch console logs
        const consoleLog = await getConsoleLogs(
          jenkinsResponse.data.buildNumber
        );

        // Update build progress with success
        setBuildProgress({
          stage: "completed",
          message: "Build completed successfully!",
          buildNumber: jenkinsResponse.data.buildNumber,
          result: jenkinsResponse.data.result,
          artifactData: jenkinsResponse.data.artifactData,
          consoleLog: consoleLog,
        });

        // Call success callback
        if (onSuccess) {
          onSuccess(jenkinsResponse.data);
        }
      } else {
        // Fetch console logs for failed build
        const consoleLog = jenkinsResponse.data.buildNumber
          ? await getConsoleLogs(jenkinsResponse.data.buildNumber)
          : "Console logs not available";

        // Update build progress with error
        setBuildProgress({
          stage: "failed",
          message: `Build failed: ${jenkinsResponse.data.message}`,
          buildNumber: jenkinsResponse.data.buildNumber,
          result: jenkinsResponse.data.result,
          artifactData: null,
          consoleLog: consoleLog,
        });

        // Call error callback
        if (onError) {
          onError(jenkinsResponse.data);
        }
      }
    } catch (error) {
      console.error("Error creating branch:", error);

      // Update build progress with error
      setBuildProgress({
        stage: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred",
        buildNumber: null,
        result: "ERROR",
        artifactData: null,
      });

      // Call error callback
      if (onError) {
        onError(error);
      }
    }
  };

  const handleBuildModalCancel = () => {
    setIsBuildModalVisible(false);
    setBuildProgress({
      stage: "",
      message: "",
      buildNumber: null,
      result: null,
      artifactData: null,
      consoleLog: "",
    });
  };

  return {
    isBuildModalVisible,
    buildProgress,
    testJenkinsConnection,
    getConsoleLogs,
    getBuildArtifacts,
    triggerJenkinsBuild,
    handleBuildModalCancel,
    triggerJenkinsFrontBuild
  };
}
