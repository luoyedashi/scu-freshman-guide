/** Hash-based section routing and shareable query params. */

const SECTION_IDS = [
  "section-hero", "section-profile", "section-guide", "section-simulator",
  "section-paths", "section-checklists", "section-scores", "section-policies",
  "section-majors", "section-campus", "section-faq", "section-services",
  "section-community", "section-contact",
];

export function initRouter() {
  window.addEventListener("hashchange", applyHash);
  applyHash();
}

function applyHash() {
  const hash = location.hash.replace("#", "");
  if (!hash || !SECTION_IDS.includes(hash)) return;
  const el = document.getElementById(hash);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

/** @param {string} sectionId */
export function navigateTo(sectionId) {
  history.replaceState(null, "", `#${sectionId}`);
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

/** @param {Record<string, string|number>} params */
export function setShareQuery(params) {
  const url = new URL(location.href);
  Object.entries(params).forEach(([k, v]) => {
    if (v === "" || v == null) url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  });
  history.replaceState(null, "", url.pathname + url.search + url.hash);
}

/** @returns {Record<string, string>} */
export function getShareQuery() {
  const out = {};
  new URL(location.href).searchParams.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}
