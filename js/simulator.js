/** Sichuan volunteer simulator — rank-based, multi-school. */

import { loadLinks, officialUrl, resolveUrl } from "./links.js";

/** @type {{ schools: object[], records: object[] }} */
let dataset = { schools: [], records: [] };

export async function initSimulator() {
  await loadLinks();
  const res = await fetch("data/sim_sichuan.json");
  dataset = await res.json();

  const catSel = document.getElementById("sim-category");
  const form = document.getElementById("sim-form");
  if (!catSel || !form) return;

  catSel.innerHTML = [
    { value: "物理", label: "物理类（理工）" },
    { value: "历史", label: "历史类（文史）" },
  ]
    .map((c) => `<option value="${c.value}">${c.label}</option>`)
    .join("");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSimulation();
  });
}

/**
 * @param {number} userRank
 * @param {number} refRank historical min rank (lower = harder to get in)
 */
function classifyTier(userRank, refRank) {
  const margin = refRank - userRank;
  if (margin >= 1200) return { tier: "保", tierClass: "safe", hint: "位次明显优于近年线" };
  if (margin >= 200) return { tier: "稳", tierClass: "stable", hint: "位次接近或优于近年线" };
  if (margin >= -1000) return { tier: "冲", tierClass: "reach", hint: "位次略逊于近年线，可冲刺" };
  return { tier: "难", tierClass: "hard", hint: "位次差距较大" };
}

function runSimulation() {
  const category = /** @type {HTMLSelectElement} */ (document.getElementById("sim-category")).value;
  const userRank = Number(/** @type {HTMLInputElement} */ (document.getElementById("sim-rank")).value);
  const out = document.getElementById("sim-result");
  if (!out || !Number.isInteger(userRank) || userRank < 1) return;

  const results = dataset.schools
    .map((school) => {
      const rows = dataset.records
        .filter((r) => r.school_id === school.id && r.category === category && r.min_rank != null)
        .sort((a, b) => b.year - a.year);

      if (rows.length === 0) return null;

      const latest = rows[0];
      const avgRank = Math.round(rows.reduce((s, r) => s + r.min_rank, 0) / rows.length);
      const { tier, tierClass, hint } = classifyTier(userRank, avgRank);
      const margin = avgRank - userRank;
      const url = resolveUrl(school.urlKey);

      return { school, rows, latest, avgRank, tier, tierClass, hint, margin, url };
    })
    .filter(Boolean);

  if (results.length === 0) {
    out.innerHTML = `<p class="sim-result__empty">暂无该科类数据，请查看<a href="${officialUrl("chsi_score")}" target="_blank" rel="noopener noreferrer">阳光高考录取数据</a>。</p>`;
    return;
  }

  const tierOrder = { 保: 0, 稳: 1, 冲: 2, 难: 3 };
  results.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || a.school.order - b.school.order);

  const counts = results.reduce(
    (acc, r) => {
      acc[r.tier] = (acc[r.tier] || 0) + 1;
      return acc;
    },
    /** @type {Record<string, number>} */ ({})
  );

  const summary = ["保", "稳", "冲", "难"]
    .filter((t) => counts[t])
    .map((t) => `${t} ${counts[t]} 所`)
    .join(" · ");

  const cards = results
    .map((r) => {
      const history = r.rows
        .map(
          (row) =>
            `<tr><td>${row.year}</td><td>${row.min_rank.toLocaleString()}</td><td>${row.min_score ?? "—"}</td></tr>`
        )
        .join("");

      return `
      <article class="sim-school sim-school--${r.tierClass}">
        <div class="sim-school__head">
          <div>
            <h4 class="sim-school__name">${r.school.name}</h4>
            <span class="sim-school__tags">${(r.school.tags || []).join(" · ")}</span>
          </div>
          <span class="sim-result__tier sim-result__tier--${r.tierClass}">${r.tier}</span>
        </div>
        <p class="sim-school__hint">${r.hint} · 近三年平均最低位次约 <strong>${r.avgRank.toLocaleString()}</strong>（你领先 ${r.margin > 0 ? "+" : ""}${r.margin.toLocaleString()} 名）</p>
        <table class="sim-result__table sim-school__table">
          <thead><tr><th>年份</th><th>最低位次</th><th>调档分</th></tr></thead>
          <tbody>${history}</tbody>
        </table>
        <a class="sim-school__link" href="${r.url}" target="_blank" rel="noopener noreferrer">查看招生信息 →</a>
      </article>`;
    })
    .join("");

  out.innerHTML = `
    <div class="sim-result__summary">
      <p>你的位次：<strong>${userRank.toLocaleString()}</strong> · ${category} · 四川省</p>
      <p class="sim-result__summary-tags">${summary}</p>
    </div>
    <div class="sim-schools">${cards}</div>
    <p class="sim-result__note">按位次模拟，数据为本科一批普通类主代码参考线，不含中外合作/医护等单独组。2026 年计划与位次可能变化，仅供参考。</p>
  `;
}
