/**
 * Project.tag drives which service experience to show (DB enum: frontend | backend).
 */
export const PROJECT_TAG = {
  WEB: "frontend",
  API: "backend",
};

export function isApiPreviewProject(tag) {
  return tag === PROJECT_TAG.API;
}

export function isWebPreviewProject(tag) {
  return !isApiPreviewProject(tag);
}

/** Display label: Frontend / Backend (matches DB enum, easier to scan). */
export function previewKindShortLabel(tag) {
  if (tag == null || tag === "") return "—";
  const s = String(tag).toLowerCase();
  if (s === PROJECT_TAG.API) return "Backend";
  if (s === PROJECT_TAG.WEB) return "Frontend";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
