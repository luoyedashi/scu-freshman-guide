/** Volunteer simulator: compare score vs historical SCU min lines. */

import { loadLinks, officialUrl } from "./links.js";

let records = [];

export async function initSimulator() {
  await loadLinks();
  const res = await fetch("data/scores.json");
  const data = await res.json();
  records = data.records;

  const provSel = document.getElementById("sim-province");
  const catSel = document.getElementById("sim-category");
  const form = document.getElementById("sim-form");

  if (!provSel || !form) return;

  const provinces = [...new Set(records.map((r) => r.province))].sort((a, b) => {
    if (a === "四川") return -1;
    if (b === "四川") return 1;
    return a.localeCompare(b, "zh-CN");
  });

  provSel.innerHTML = provinces.map((p) => `<option value="${p}">${p}</option>`).join("");

  const syncCategories = () => {
    const p = provSel.value;
    const cats = [...new Set(records.filter((r) => r.province === p).map((r) => r.category))];
    catSel.innerHTML = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  };

  provSel.addEventListener("change", syncCategories);
  syncCategories();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSimulation();
  });
}

function runSimulation() {
  const province = /** @type {HTMLSelectElement} */ (document.getElementById("sim-province")).value;
  const category = /** @type {HTMLSelectElement} */ (document.getElementById("sim-category")).value;
  const score = Number(/** @type {HTMLInputElement} */ (document.getElementById("sim-score")).value);
  const out = document.getElementById("sim-result");
  if (!out || Number.isNaN(score)) return;

  const rows = records
    .filter((r) => r.province === province && r.category === category && r.min_score != null)
    .sort((a, b) => b.year - a.year);

  if (rows.length === 0) {
    out.innerHTML = `<p class="sim-result__empty">暂无该省科类数据，请查看<a href="${officialUrl("chsi_score")}" target="_blank" rel="noopener">官方录取数据</a>。</p>`;
    return;
  }

  const latest = rows[0];
  const avg =
    rows.reduce((s, r) => s + (r.min_score || 0), 0) / rows.length;
  const diff = score - latest.min_score;
  const diffAvg = score - avg;

  let tier = "稳";
  let tierClass = "stable";
  let advice =
    "你的分数高于近年川大该省最低线，录取概率相对较高，但仍需结合位次与当年计划。";

  if (diff < -20) {
    tier = "难";
    tierClass = "reach";
    advice =
      "分数与近年川大线差距较大，建议重点考虑其他院校，或关注专项、中外合作等批次。";
  } else if (diff < -5) {
    tier = "冲";
    tierClass = "reach";
    advice =
      "略低于近年最低线，可作冲刺志愿，建议搭配稳妥院校与保底院校。";
  } else if (diff < 10) {
    tier = "稳";
    tierClass = "stable";
    advice = "接近或达到近年最低线，建议结合三年位次综合判断，并拉开志愿梯度。";
  } else {
    tier = "保";
    tierClass = "safe";
    advice = "高于近年最低线，相对稳妥，注意专业组内冷热与调剂意愿。";
  }

  const historyHtml = rows
    .map(
      (r) =>
        `<tr><td>${r.year}</td><td>${r.min_score}</td><td>${r.control_line ?? "—"}</td></tr>`
    )
    .join("");

  out.innerHTML = `
    <div class="sim-result__tier sim-result__tier--${tierClass}">${tier}</div>
    <p class="sim-result__advice">${advice}</p>
    <ul class="sim-result__stats">
      <li>你的分数：<strong>${score}</strong></li>
      <li>${latest.year}年川大最低：<strong>${latest.min_score}</strong>（相差 ${diff > 0 ? "+" : ""}${diff}）</li>
      <li>近三年均值约：<strong>${avg.toFixed(0)}</strong>（相差 ${diffAvg > 0 ? "+" : ""}${diffAvg.toFixed(0)}）</li>
    </ul>
    <table class="sim-result__table">
      <thead><tr><th>年份</th><th>川大最低</th><th>省控线</th></tr></thead>
      <tbody>${historyHtml}</tbody>
    </table>
    <p class="sim-result__note">模拟仅供参考，不代表2026年录取结果。咨询填报可联系俊贤学长。</p>
  `;
}
