function trimBase(url) {
  return String(url || "").replace(/\/+$/, "");
}

export const JENKINS_BASE = trimBase(
  process.env.JENKINS_BASE_URL || "https://pep-admin.ienetworks.co",
);

export const JENKINS_USER = process.env.JENKINS_USER || "pep-jenkins";
export const JENKINS_PASSWORD = process.env.JENKINS_PASSWORD || "";

/** Backend preview domain job (Jenkins job name). */
export const JOB_BACKEND_PREVIEW =
  process.env.JENKINS_JOB_BACKEND_PREVIEW || "test-preview";

/** Deletes a preview domain in Jenkins. */
export const JOB_DELETE_DOMAIN =
  process.env.JENKINS_JOB_DELETE_DOMAIN || "Delete-Preview-Domain";

/** Frontend preview deployment job. */
export const JOB_FRONTEND_PREVIEW =
  process.env.JENKINS_JOB_FRONTEND_PREVIEW || "test-preview-FE";

export function jenkinsApiJsonUrl() {
  return `${JENKINS_BASE}/api/json`;
}

export function jenkinsBuildWithParamsUrl(jobName) {
  return `${JENKINS_BASE}/job/${jobName}/buildWithParameters`;
}

export function jenkinsQueueItemUrl(queueId) {
  return `${JENKINS_BASE}/queue/item/${queueId}/api/json`;
}

export function jenkinsBuildApiUrl(jobName, buildNumber) {
  return `${JENKINS_BASE}/job/${jobName}/${buildNumber}/api/json`;
}

export function jenkinsArtifactUrl(jobName, buildNumber, relativePath) {
  return `${JENKINS_BASE}/job/${jobName}/${buildNumber}/artifact/${relativePath}`;
}
