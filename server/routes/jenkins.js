/* eslint-disable no-undef */
import express from "express";
import axios from "axios";
import urlConfigService from "../services/urlConfigService.js";
import { FrontendNodeBuild } from "../models/index.js";
import {
  JENKINS_USER,
  JENKINS_PASSWORD,
  JOB_BACKEND_PREVIEW,
  JOB_DELETE_DOMAIN,
  JOB_FRONTEND_PREVIEW,
  jenkinsApiJsonUrl,
  jenkinsBuildWithParamsUrl,
  jenkinsQueueItemUrl,
  jenkinsBuildApiUrl,
  jenkinsArtifactUrl,
} from "../config/jenkinsServer.js";

const router = express.Router();

// Test route to verify Jenkins routes are working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Jenkins routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Test Jenkins connectivity
router.get("/test-connection", async (req, res) => {
  try {
    const response = await axios.get(jenkinsApiJsonUrl(), {
      auth: {
        username: JENKINS_USER,
        password: JENKINS_PASSWORD,
      },
      timeout: 10000,
    });

    res.json({
      success: true,
      message: "Jenkins server is reachable",
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    console.error("Jenkins connectivity test failed:", error);
    res.status(500).json({
      success: false,
      message: "Jenkins server is not reachable",
      error: error.message,
      code: error.code,
    });
  }
});

// Trigger Preview Domain Job - GET method
router.post("/trigger-preview-job", async (req, res) => {
  try {
    const ENV_NAME = req.body.ENV_NAME;
    const REPO_URL = req.body.REPO_URL;
    const BRANCH_NAME = req.body.BRANCH_NAME;
    const PORT = req.body.PORT;
    const DOMAIN_NAME = req.body.DOMAIN_NAME;

    // Validate required parameters
    if (!ENV_NAME || !REPO_URL || !BRANCH_NAME || !PORT || !DOMAIN_NAME) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: ${ENV_NAME}, ${REPO_URL}, ${BRANCH_NAME}, ${PORT}, ${DOMAIN_NAME}`,
      });
    }

    const jenkinsUrl = jenkinsBuildWithParamsUrl(JOB_BACKEND_PREVIEW);
    const response = await axios.post(
      `${jenkinsUrl}?token=domain&ENV_NAME=${ENV_NAME}&REPO_URL=${REPO_URL}&BRANCH_NAME=${BRANCH_NAME}&PORT=${PORT}&DOMAIN_NAME=${DOMAIN_NAME}`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${JENKINS_USER}:${JENKINS_PASSWORD}`).toString("base64")}`,
        },
        timeout: 30000,
      },
    );
    if (response.status === 201 || response.status === 200) {
      // Get queue URL from response headers
      const queueUrl = response.headers.location;
      const queueId = queueUrl.split("/").slice(-2, -1)[0];
      let buildNumber = null;

      // Monitor queue until build starts
      while (!buildNumber) {
        const queueResponse = await axios.get(jenkinsQueueItemUrl(queueId), {
          auth: {
            username: JENKINS_USER,
            password: JENKINS_PASSWORD,
          },
        });

        const queueData = queueResponse.data;
        if (queueData.executable) {
          buildNumber = queueData.executable.number;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Monitor build until completion
      let buildComplete = false;
      let artifactFilePath;

      while (!buildComplete) {
        const buildResponse = await axios.get(
          jenkinsBuildApiUrl(JOB_BACKEND_PREVIEW, buildNumber),
          {
            auth: {
              username: JENKINS_USER,
              password: JENKINS_PASSWORD,
            },
          },
        );

        const buildData = buildResponse.data;

        if (!buildData.building) {
          buildComplete = true;

          // Check if build was successful
          if (buildData.result !== "SUCCESS") {
            return res.status(400).json({
              success: false,
              message: `Build failed with result: ${buildData.result}`,
              buildNumber: buildNumber,
              result: buildData.result,
            });
          }

          // Get artifact file path
          if (buildData.artifacts && buildData.artifacts.length > 0) {
            artifactFilePath = buildData.artifacts[0].relativePath;
          } else {
            return res.status(400).json({
              success: false,
              message: "Artifact file path not found.",
            });
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      const domainOutput = await axios.get(
        jenkinsArtifactUrl(JOB_BACKEND_PREVIEW, buildNumber, artifactFilePath),
        {
          auth: {
            username: JENKINS_USER,
            password: JENKINS_PASSWORD,
          },
        },
      );

      // Check for errors in the artifact
      if (domainOutput.data.error) {
        return res.status(400).json({
          success: false,
          message: domainOutput.data.error,
          buildNumber: buildNumber,
          artifactPath: artifactFilePath,
        });
      }

      // Return successful result
      res.json({
        success: true,
        message: "Preview domain job completed successfully",
        jobUrl: jenkinsUrl,
        buildNumber: buildNumber,
        result: "SUCCESS",
        artifactData: domainOutput.data,
        artifactPath: artifactFilePath,
      });
    } else {
      console.error(
        "Jenkins job trigger failed:",
        response.status,
        response.statusText,
      );
      res.status(response.status).json({
        success: false,
        message: `Failed to trigger Jenkins job: ${response.statusText}`,
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error triggering Jenkins job:", error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: `Jenkins job failed: ${error.response.status} - ${error.response.statusText}`,
        status: error.response.status,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error while triggering Jenkins job",
        error: error.message,
      });
    }
  }
});
router.post("/delete-preview-job", async (req, res) => {
  try {
    const DOMAIN_NAME = req.body.DOMAIN_NAME;

    // Validate required parameters
    if (!DOMAIN_NAME) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: ${DOMAIN_NAME}`,
      });
    }

    const jenkinsUrl = jenkinsBuildWithParamsUrl(JOB_DELETE_DOMAIN);
    const response = await axios.post(
      `${jenkinsUrl}?token=domain&DOMAIN_NAME=${DOMAIN_NAME}`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${JENKINS_USER}:${JENKINS_PASSWORD}`).toString("base64")}`,
        },
        timeout: 30000,
      },
    );
    if (response.status === 201 || response.status === 200) {
      // Get queue URL from response headers
      const queueUrl = response.headers.location;
      const queueId = queueUrl.split("/").slice(-2, -1)[0];
      let buildNumber = null;

      // Monitor queue until build starts
      while (!buildNumber) {
        const queueResponse = await axios.get(jenkinsQueueItemUrl(queueId), {
          auth: {
            username: JENKINS_USER,
            password: JENKINS_PASSWORD,
          },
        });

        const queueData = queueResponse.data;
        if (queueData.executable) {
          buildNumber = queueData.executable.number;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Monitor build until completion
      let buildComplete = false;
      let artifactFilePath = null;
      let artifactData = null;

      while (!buildComplete) {
        const buildResponse = await axios.get(
          jenkinsBuildApiUrl(JOB_DELETE_DOMAIN, buildNumber),
          {
            auth: {
              username: JENKINS_USER,
              password: JENKINS_PASSWORD,
            },
          },
        );

        const buildData = buildResponse.data;

        if (!buildData.building) {
          buildComplete = true;

          // Check if build was successful
          if (buildData.result !== "SUCCESS") {
            return res.status(400).json({
              success: false,
              message: `Delete job failed with result: ${buildData.result}`,
              buildNumber: buildNumber,
              result: buildData.result,
            });
          }

          // Get artifact file path (optional for delete jobs)
          if (buildData.artifacts && buildData.artifacts.length > 0) {
            artifactFilePath = buildData.artifacts[0].relativePath;
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Retrieve the artifact if it exists
      if (artifactFilePath) {
        try {
          const domainOutput = await axios.get(
            jenkinsArtifactUrl(
              JOB_DELETE_DOMAIN,
              buildNumber,
              artifactFilePath,
            ),
            {
              auth: {
                username: JENKINS_USER,
                password: JENKINS_PASSWORD,
              },
            },
          );
          // Check for errors in the artifact
          if (domainOutput.data.error) {
            return res.status(400).json({
              success: false,
              message: domainOutput.data.error,
              buildNumber: buildNumber,
              artifactPath: artifactFilePath,
            });
          }

          artifactData = domainOutput.data;
        } catch (artifactError) {
          console.warn(
            "⚠️ Warning: Failed to parse artifact output",
            artifactError?.message || artifactError,
          );
        }
      }

      // Return successful result
      res.json({
        success: true,
        message: "Domain deletion completed successfully",
        jobUrl: jenkinsUrl,
        buildNumber: buildNumber,
        result: "SUCCESS",
        artifactData: artifactData,
        artifactPath: artifactFilePath,
      });
    } else {
      console.error(
        "Jenkins delete job trigger failed:",
        response.status,
        response.statusText,
      );
      res.status(response.status).json({
        success: false,
        message: `Failed to trigger Jenkins delete job: ${response.statusText}`,
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error triggering Jenkins delete job:", error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: `Jenkins delete job failed: ${error.response.status} - ${error.response.statusText}`,
        status: error.response.status,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error while triggering Jenkins delete job",
        error: error.message,
      });
    }
  }
});

// Trigger Frontend Deployment Job
router.post("/trigger-frontend-job", async (req, res) => {
  try {
    const ENV_NAME = req.body.ENV_NAME;
    const REPO_URL = req.body.REPO_URL;
    const BRANCH_NAME = req.body.BRANCH_NAME;
    const PORT = req.body.PORT;
    const DOMAIN_NAME = req.body.DOMAIN_NAME;
    const URL_CONFIGS = req.body.URL_CONFIGS ?? "[]";
    const ENV_VARS = req.body.ENV_VARS ?? null;

    // Validate required parameters
    if (!ENV_NAME || !REPO_URL || !BRANCH_NAME || !PORT || !DOMAIN_NAME) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: ENV_NAME, REPO_URL, BRANCH_NAME, PORT, DOMAIN_NAME`,
      });
    }

    const jenkinsUrl = jenkinsBuildWithParamsUrl(JOB_FRONTEND_PREVIEW);
    const response = await axios.post(
      `${jenkinsUrl}?token=domain&ENV_NAME=${ENV_NAME}&REPO_URL=${REPO_URL}&BRANCH_NAME=${BRANCH_NAME}&PORT=${PORT}&DOMAIN_NAME=${DOMAIN_NAME}&URL_CONFIGS=${encodeURIComponent(URL_CONFIGS)}${ENV_VARS ? `&ENV_VARS=${encodeURIComponent(ENV_VARS)}` : ""}`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${JENKINS_USER}:${JENKINS_PASSWORD}`).toString("base64")}`,
        },
        timeout: 30000,
      },
    );

    if (response.status === 201 || response.status === 200) {
      // Get queue URL from response headers
      const queueUrl = response.headers.location;
      const queueId = queueUrl.split("/").slice(-2, -1)[0];
      let buildNumber = null;

      // Monitor queue until build starts
      while (!buildNumber) {
        const queueResponse = await axios.get(jenkinsQueueItemUrl(queueId), {
          auth: {
            username: JENKINS_USER,
            password: JENKINS_PASSWORD,
          },
        });

        const queueData = queueResponse.data;
        if (queueData.executable) {
          buildNumber = queueData.executable.number;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Monitor build until completion
      let buildComplete = false;
      let artifactFilePath;
      let completedBuildMeta = null;

      while (!buildComplete) {
        const buildResponse = await axios.get(
          jenkinsBuildApiUrl(JOB_FRONTEND_PREVIEW, buildNumber),
          {
            auth: {
              username: JENKINS_USER,
              password: JENKINS_PASSWORD,
            },
          },
        );

        const buildData = buildResponse.data;

        if (!buildData.building) {
          buildComplete = true;
          // Check if build was successful
          if (buildData.result !== "SUCCESS") {
            return res.status(400).json({
              success: false,
              message: `Frontend deployment failed with result: ${buildData.result}`,
              buildNumber: buildNumber,
              result: buildData.result,
            });
          }

          // Get artifact file path
          if (buildData.artifacts && buildData.artifacts.length > 0) {
            artifactFilePath = buildData.artifacts[0].relativePath;
            completedBuildMeta = buildData;
          } else {
            return res.status(400).json({
              success: false,
              message: "Artifact file path not found.",
            });
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      const domainOutput = await axios.get(
        jenkinsArtifactUrl(JOB_FRONTEND_PREVIEW, buildNumber, artifactFilePath),
        {
          auth: {
            username: JENKINS_USER,
            password: JENKINS_PASSWORD,
          },
        },
      );

      // Check for errors in the artifact
      if (domainOutput.data.error) {
        return res.status(400).json({
          success: false,
          message: domainOutput.data.error,
          buildNumber: buildNumber,
          artifactPath: artifactFilePath,
        });
      }

      // Create URL configs in database on successful deployment (only HTTP/*_URL rows; plain env vars stay out of url_configs)
      try {
        const parsedConfigs = JSON.parse(URL_CONFIGS ?? "[]");
        const urlConfigsData = Array.isArray(parsedConfigs)
          ? parsedConfigs
          : parsedConfigs?.urlConfigs;
        const frontnodeId = req.body.frontnode_id || 1; // Default to 1 if not provided
        const forDb = Array.isArray(urlConfigsData)
          ? urlConfigsData
              .filter((cfg) => {
                const k = cfg?.key ?? cfg?.name;
                const v = String(cfg?.value ?? cfg?.url ?? "").trim();
                if (typeof k !== "string") return false;
                if (k.toUpperCase().endsWith("_URL")) return true;
                return v.startsWith("http://") || v.startsWith("https://");
              })
              .map((cfg) => {
                const name = cfg.key ?? cfg.name;
                let url = String(cfg?.value ?? cfg?.url ?? "").trim();
                const isHttp =
                  url.startsWith("http://") || url.startsWith("https://");
                if (isHttp) {
                  url = url.replace(/\/+$/, "");
                  if (!url.endsWith("/api/v1")) url += "/api/v1";
                }
                return {
                  name,
                  url,
                  description: `From env ${name}`,
                  serviceType:
                    isHttp || String(name).toUpperCase().endsWith("_URL")
                      ? "api"
                      : "env",
                  defaultUrl: null,
                };
              })
          : [];

        if (forDb.length > 0) {
          await urlConfigService.createUrlConfigsFromDeployment(
            forDb,
            frontnodeId,
          );
        }
      } catch (urlConfigError) {
        console.error(
          "⚠️ Warning: Failed to save URL configs to database:",
          urlConfigError,
        );
        console.error("📋 Error details:", urlConfigError.message);
        // Don't fail the deployment if URL config saving fails
      }

      try {
        const rawFid = req.body.frontnode_id ?? req.body.frontnodeId;
        const fid =
          typeof rawFid === "number" ? rawFid : parseInt(String(rawFid), 10);
        const bn = parseInt(buildNumber, 10);
        if (Number.isFinite(fid) && Number.isFinite(bn) && completedBuildMeta) {
          const builtAt = completedBuildMeta.timestamp
            ? new Date(completedBuildMeta.timestamp)
            : new Date();
          await FrontendNodeBuild.create({
            frontnode_id: fid,
            build_number: bn,
            built_at: builtAt,
          });
        } else if (!Number.isFinite(fid)) {
          console.warn(
            "⚠️ Build history skipped: missing or invalid frontnode_id in request body",
          );
        }
      } catch (bhErr) {
        console.error("⚠️ Failed to record build history:", bhErr);
      }

      // Return successful result
      res.json({
        success: true,
        message: "Frontend deployment completed successfully",
        jobUrl: jenkinsUrl,
        buildNumber: buildNumber,
        result: "SUCCESS",
        artifactData: domainOutput.data,
        artifactPath: artifactFilePath,
      });
    } else {
      console.error(
        "Frontend deployment job trigger failed:",
        response.status,
        response.statusText,
      );
      res.status(response.status).json({
        success: false,
        message: `Failed to trigger frontend deployment job: ${response.statusText}`,
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error triggering frontend deployment job:", error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: `Frontend deployment job failed: ${error.response.status} - ${error.response.statusText}`,
        status: error.response.status,
      });
    } else {
      res.status(500).json({
        success: false,
        message:
          "Internal server error while triggering frontend deployment job",
        error: error.message,
      });
    }
  }
});

export default router;
