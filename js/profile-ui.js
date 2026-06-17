import { getProfile, saveProfile, onProfileChange, buildConsultText, scoreCategoryFor } from "./profile.js";
import { navigateTo } from "./router.js";

export function initProfileUI() {
  const form = document.getElementById("profile-form");
  const banner = document.getElementById("profile-banner");
  if (!form) return;

  const p = getProfile();
  /** @type {HTMLSelectElement|null} */ (document.getElementById("profile-province")).value = p.province;
  /** @type {HTMLSelectElement|null} */ (document.getElementById("profile-category")).value = p.category;
  const rankEl = /** @type {HTMLInputElement|null} */ (document.getElementById("profile-rank"));
  if (rankEl && p.rank != null) rankEl.value = String(p.rank);

  updateBanner(banner);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const province = /** @type {HTMLSelectElement} */ (document.getElementById("profile-province")).value;
    const category = /** @type {HTMLSelectElement} */ (document.getElementById("profile-category")).value;
    const rankRaw = /** @type {HTMLInputElement} */ (document.getElementById("profile-rank")).value;
    const rank = rankRaw ? Number(rankRaw) : null;
    saveProfile({ province, category, rank: Number.isInteger(rank) ? rank : null });

    syncSimForm();
    window.dispatchEvent(new CustomEvent("profile:saved"));
    updateBanner(banner);

    if (province === "四川" && rank) {
      navigateTo("section-simulator");
      window.dispatchEvent(new CustomEvent("sim:run"));
    }
  });

  document.getElementById("profile-copy-consult")?.addEventListener("click", async () => {
    const text = buildConsultText();
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById("profile-copy-consult");
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "已复制";
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }
    } catch {
      prompt("复制以下咨询话术：", text);
    }
  });

  onProfileChange(() => updateBanner(banner));
}

function updateBanner(banner) {
  if (!banner) return;
  const p = getProfile();
  if (!p.rank) {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
  const catLabel = p.category === "历史" ? "历史类" : "物理类";
  banner.innerHTML = `
    <span class="profile-banner__text">${p.province} · ${catLabel} · 位次 <strong>${p.rank.toLocaleString()}</strong></span>
    <button type="button" class="profile-banner__btn" data-go="section-simulator">看模拟</button>`;
  banner.querySelector("[data-go]")?.addEventListener("click", () => {
    navigateTo("section-simulator");
    window.dispatchEvent(new CustomEvent("sim:run"));
  });
}

export function syncSimForm() {
  const p = getProfile();
  const cat = document.getElementById("sim-category");
  const rank = document.getElementById("sim-rank");
  if (cat) cat.value = p.category;
  if (rank && p.rank != null) rank.value = String(p.rank);
}

export function syncHeroProvince() {
  const p = getProfile();
  const sel = document.getElementById("hero-province");
  if (sel) sel.value = p.province;
}

export { scoreCategoryFor };