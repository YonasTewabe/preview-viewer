function trimTrailingSlashes(s) {
  return String(s ?? "").replace(/\/+$/, "");
}

/** Jenkins UI origin (no trailing slash). Used for stored job links only. */
export const JENKINS_BASE_URL = trimTrailingSlashes(
  import.meta.env.VITE_JENKINS_BASE_URL || "https://pep-admin.ienetworks.co",
);

export const JENKINS_JOB_BACKEND_PREVIEW =
  import.meta.env.VITE_JENKINS_JOB_BACKEND_PREVIEW || "test-preview";

export const JENKINS_JOB_FRONTEND_PREVIEW =
  import.meta.env.VITE_JENKINS_JOB_FRONTEND_PREVIEW || "test-preview-FE";

/** Folder URL for a Jenkins job (trailing slash), for display / DB metadata. */
export function jenkinsJobFolderUrl(jobName) {
  return `${JENKINS_BASE_URL}/job/${jobName}/`;
}

/** App API base (trailing slash), e.g. `http://localhost:4000/api/`. */
export function appApiBase() {
  const b = import.meta.env.VITE_BACKEND_URL || "";
  return b.endsWith("/") ? b : `${b}/`;
}
