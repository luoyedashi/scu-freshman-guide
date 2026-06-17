/** Sichuan rank-based simulator with gradient table and share URL. */

import { loadLinks, officialUrl, resolveUrl } from "./links.js";
import { fetchJson, renderFetchError } from "./fetchUtil.js";
import { getProfile, saveProfile } from "./profile.js";
import { setShareQuery, getShareQuery } from "./router.js";
import { syncSimForm } from "./profile-ui.js";

/** @type {{ schools: object[], records: object[], meta?: object }} */
let dataset = { schools: [], records: [] };

const TIER_ORDER = { 保: 0, 稳: 1, 冲: 2, 难: 3 };

export async function initSimulator() {
  await loadLinks();
  try {
    dataset = await fetchJson("data/sim_sichuan.json");
  } catch {
    const out = document.getElementById("sim-result");
    renderFetchError(out, "模拟数据加载失败", () => initSimulator());
    return;
  }

  const catSel = document.getElementById("sim-category");
  const form = document.getElementById("sim-form");
  if (!catSel || !form) return;

  catSel.innerHTML = [
    { value: "物理", label: "物理类（理工）" },
    { value: "历史", label: "历史类（文史）" },
  ]
    .map((c) => `<option value="${c.value}">${c.label}</option>`)
    .join("");

  syncSimForm();

  const q = getShareQuery();
  if (q.rank) {
    const rankEl = document.getElementById("sim-rank");
    if (rankEl) rankEl.value = q.rank;
    if (q.cat) catSel.value = q.cat;
    runSimulation();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSimulation();
  });

  window.addEventListener("sim:run", () => {
    syncSimForm();
    runSimulation();
  });
}

function classifyTier(userRank, refRank) {
  const margin = refRank - userRank;
  if (margin >= 1200) return { tier: "保", tierClass: "safe" };
  if (margin >= 200) return { tier: "稳", tierClass: "stable" };
  if (margin >= -1000) return { tier: "冲", tierClass: "reach" };
  return { tier: "难", tierClass: "hard" };
}

function runSimulation() {
  const category = /** @type {HTMLSelectElement} */ (document.getElementById("sim-category")).value;
  const userRank = Number(/** @type {HTMLInputElement} */ (document.getElementById("sim-rank")).value);
  const out = document.getElementById("sim-result");
  if (!out || !Number.isInteger(userRank) || userRank < 1) return;

  saveProfile({ category, rank: userRank });
  setShareQuery({ rank: userRank, cat: category });
  history.replaceState(null, "", `${location.pathname}${location.search}#section-simulator`);

  const results = dataset.schools
    .map((school) => {
      const rows = dataset.records
        .filter((r) => r.school_id === school.id && r.category === category && r.min_rank != null)
        .sort((a, b) => b.year - a.year);
      if (rows.length === 0) return null;

      const avgRank = Math.round(rows.reduce((s, r) => s + r.min_rank, 0) / rows.length);
      const { tier, tierClass } = classifyTier(userRank, avgRank);
      return {
        school,
        rows,
        avgRank,
        tier,
        tierClass,
        margin: avgRank - userRank,
        url: resolveUrl(school.urlKey),
      };
    })
    .filter(Boolean);

  if (results.length === 0) {
    out.innerHTML = `<p class="sim-result__empty">暂无该科类数据，请查看<a href="${officialUrl("chsi_score")}" target="_blank" rel="noopener noreferrer">阳光高考录取数据</a>。</p>`;
    return;
  }

  results.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.school.order - b.school.order);

  const gradientRows = ["冲", "稳", "保", "难"]
    .map((tier) => {
      const schools = results.filter((r) => r.tier === tier);
      if (!schools.length) return "";
      return schools
        .map(
          (r) =>
            `<tr class="grad-row grad-row--${r.tierClass}">
              <td><span class="sim-result__tier sim-result__tier--${r.tierClass}">${r.tier}</span></td>
              <td><strong>${r.school.name}</strong><br><span class="grad-sub">${(r.school.tags || []).join(" · ")}</span></td>
              <td>${r.avgRank.toLocaleString()}</td>
              <td>${r.margin > 0 ? "+" : ""}${r.margin.toLocaleString()}</td>
            </tr>`
        )
        .join("");
    })
    .join("");

  const shareUrl = location.href;

  out.innerHTML = `
    <div class="sim-result__summary">
      <p>你的位次：<strong>${userRank.toLocaleString()}</strong> · ${category} · 四川省</p>
      <button type="button" class="btn-outline btn-share" id="sim-copy-link">复制分享链接</button>
    </div>
    <div class="grad-table-wrap">
      <table class="grad-table" aria-label="志愿梯度参考表">
        <thead><tr><th>梯度</th><th>院校</th><th>近三年均位次</th><th>与你差距</th></tr></thead>
        <tbody>${gradientRows}</tbody>
      </table>
    </div>
    <details class="sim-details">
      <summary>展开各校三年明细</summary>
      <div class="sim-schools">${results.map(renderSchoolCard).join("")}</div>
    </details>
    <p class="sim-result__note">按位次模拟 · 普通类一批主代码 · 不含中外合作/医护等 · 仅供参考不构成录取承诺</p>
  `;

  document.getElementById("sim-copy-link")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      const btn = document.getElementById("sim-copy-link");
      if (btn) {
        btn.textContent = "已复制链接";
        setTimeout(() => { btn.textContent = "复制分享链接"; }, 2000);
      }
    } catch {
      prompt("复制链接：", shareUrl);
    }
  });
}

function renderSchoolCard(r) {
  const history = r.rows
    .map(
      (row) =>
        `<tr><td>${row.year}</td><td>${row.min_rank.toLocaleString()}</td><td>${row.min_score ?? "—"}</td></tr>`
    )
    .join("");
  return `
    <article class="sim-school sim-school--${r.tierClass}">
      <div class="sim-school__head">
        <h4 class="sim-school__name">${r.school.name}</h4>
        <span class="sim-result__tier sim-result__tier--${r.tierClass}">${r.tier}</span>
      </div>
      <table class="sim-result__table"><thead><tr><th>年</th><th>位次</th><th>分</th></tr></thead><tbody>${history}</tbody></table>
      <a class="sim-school__link" href="${r.url}" target="_blank" rel="noopener noreferrer">招生信息 →</a>
    </article>`;
}

export { runSimulation };
