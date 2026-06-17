/** Optional analytics & profile sync to backend API. */

import { getProfile } from "./profile.js";
import { fetchJson } from "./fetchUtil.js";

const CONSENT_KEY = "junxian_analytics_consent";
const SESSION_KEY = "junxian_session_id";

/** @type {{ enabled: boolean, apiBase: string }} */
let config = { enabled: false, apiBase: "" };

export async function initAnalytics() {
  try {
    const site = await fetchJson("data/site.json");
    const a = site.analytics || {};
    config = {
      enabled: Boolean(a.enabled && a.apiBase),
      apiBase: (a.apiBase || "").replace(/\/$/, ""),
    };
  } catch {
    config = { enabled: false, apiBase: "" };
  }

  restoreConsentUI();
  if (hasConsent() && config.enabled) {
    track("pageview", { path: location.pathname + location.search + location.hash });
  }

  window.addEventListener("profile:saved", () => syncProfile());
  window.addEventListener("sim:run", () => {
    const rank = document.getElementById("sim-rank")?.value;
    const cat = document.getElementById("sim-category")?.value;
    track("sim_run", { rank, category: cat });
  });
}

export function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === "1";
}

export function setConsent(value) {
  localStorage.setItem(CONSENT_KEY, value ? "1" : "0");
  const bar = document.getElementById("consent-bar");
  if (bar) bar.hidden = value;
  if (value && config.enabled) {
    track("pageview", { path: location.pathname, consent_granted: true });
  }
}

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `s${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * @param {string} eventType
 * @param {Record<string, unknown>} [payload]
 */
export function track(eventType, payload = {}) {
  if (!config.enabled || !hasConsent()) return;
  const body = {
    events: [
      {
        session_id: getSessionId(),
        event_type: eventType,
        payload,
        page_path: location.pathname + location.search,
        referrer: document.referrer || null,
      },
    ],
  };
  send("/api/v1/events", body);
}

export async function syncProfile() {
  if (!config.enabled || !hasConsent()) return;
  const syncCheck = document.getElementById("profile-sync-consent");
  if (syncCheck && !syncCheck.checked) return;

  const p = getProfile();
  send("/api/v1/profile", {
    session_id: getSessionId(),
    province: p.province,
    category: p.category,
    rank: p.rank,
  });
  track("profile_save", { province: p.province, category: p.category, has_rank: p.rank != null });
}

function send(path, body) {
  fetch(`${config.apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

function restoreConsentUI() {
  const bar = document.getElementById("consent-bar");
  if (!bar || !config.enabled) {
    if (bar) bar.hidden = true;
    return;
  }
  bar.hidden = hasConsent();
  document.getElementById("consent-accept")?.addEventListener("click", () => setConsent(true));
  document.getElementById("consent-decline")?.addEventListener("click", () => setConsent(false));

  const syncCheck = document.getElementById("profile-sync-consent");
  if (syncCheck) syncCheck.disabled = !hasConsent();
  document.getElementById("consent-accept")?.addEventListener("click", () => {
    if (syncCheck) syncCheck.disabled = false;
  });
}
