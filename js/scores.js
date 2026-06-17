/** Score data with per-province lazy loading. */

import { loadLinks, officialUrl } from "./links.js";
import { fetchJson, renderFetchError } from "./fetchUtil.js";
import { getProfile, onProfileChange, scoreCategoryFor } from "./profile.js";

/** @type {import('./profile.js').ScoreRecord[]} */
let allRecords = [];
/** @type {string[]} */
let provinceList = [];
/** @type {Record<string, unknown>|null} */
let scoresMeta = null;
/** @type {Set<string>} */
const loadedProvinces = new Set();

const filters = {
  province: "四川",
  year: 2024,
  category: "理工",
  batch: "普通类一批",
};

const PROVINCE_MODES = {
  北京: "新高考", 天津: "新高考", 河北: "新高考", 山西: "老高考", 内蒙古: "老高考",
  辽宁: "新高考", 吉林: "新高考", 黑龙江: "新高考", 上海: "新高考", 江苏: "新高考",
  浙江: "新高考", 安徽: "新高考", 福建: "新高考", 江西: "新高考", 山东: "新高考",
  河南: "老高考", 湖北: "新高考", 湖南: "新高考", 广东: "新高考", 广西: "新高考",
  海南: "新高考", 重庆: "新高考", 四川: "老高考", 贵州: "新高考", 云南: "老高考",
  西藏: "老高考", 陕西: "老高考", 甘肃: "新高考", 青海: "老高考", 宁夏: "老高考", 新疆: "老高考",
};

export async function initScores() {
  await loadLinks();
  const profile = getProfile();
  filters.province = profile.province || "四川";

  try {
    const index = await fetchJson("data/scores_index.json");
    scoresMeta = index.meta;
    provinceList = index.provinces || [];
    await loadProvince(filters.province);
    updateMetaDisplay();
  } catch {
    const data = await fetchJson("data/scores.json");
    allRecords = data.records;
    scoresMeta = data.meta;
    provinceList = provinces();
    loadedProvinces.add("*");
    updateMetaDisplay();
  }

  buildProvinceSelect();
  syncProvinceUI();
  renderScores();

  document.getElementById("province-go")?.addEventListener("click", async () => {
    const sel = /** @type {HTMLSelectElement} */ (document.getElementById("hero-province"));
    if (sel?.value) {
      filters.province = sel.value;
      await loadProvince(filters.province);
      syncProvinceUI();
      document.getElementById("section-scores")?.scrollIntoView({ behavior: "smooth" });
      renderScores();
    }
  });

  onProfileChange(async (p) => {
    filters.province = p.province;
    await loadProvince(p.province);
    syncProvinceUI();
    renderScores();
  });

  window.addEventListener("profile:saved", async () => {
    const p = getProfile();
    filters.province = p.province;
    filters.category = scoreCategoryFor(p.province, p.category);
    await loadProvince(p.province);
    syncProvinceUI();
    renderScores();
  });
}

async function loadProvince(province) {
  if (loadedProvinces.has(province) || loadedProvinces.has("*")) return;
  const data = await fetchJson(`data/scores/${encodeURIComponent(province)}.json`);
  allRecords = allRecords.filter((r) => r.province !== province).concat(data.records);
  loadedProvinces.add(province);
}

function updateMetaDisplay() {
  const metaEl = document.getElementById("scores-updated");
  if (metaEl && scoresMeta) {
    const n = provinceList.length || scoresMeta.provinces_covered?.length || 31;
    metaEl.textContent = `数据更新：${scoresMeta.updated} · 覆盖 ${n} 省 · 来源：阳光高考`;
  }
}

function provinces() {
  const fromRecords = [...new Set(allRecords.map((r) => r.province))];
  const list = provinceList.length ? provinceList : fromRecords;
  return [...list].sort((a, b) => {
    if (a === "四川") return -1;
    if (b === "四川") return 1;
    return a.localeCompare(b, "zh-CN");
  });
}

function recordsForProvince(province) {
  return allRecords.filter((r) => r.province === province);
}

function yearsForProvince(province) {
  return [...new Set(recordsForProvince(province).map((r) => r.year))].sort((a, b) => b - a);
}

function categoriesFor(province, year) {
  return [...new Set(recordsForProvince(province).filter((r) => r.year === year).map((r) => r.category))];
}

function batchesFor(province, year, category) {
  return [
    ...new Set(
      recordsForProvince(province)
        .filter((r) => r.year === year && r.category === category)
        .map((r) => r.batch)
    ),
  ];
}

function defaultCategory(province, year) {
  const cats = categoriesFor(province, year);
  const mode = PROVINCE_MODES[province] || "老高考";
  const p = getProfile();
  const fromProfile = scoreCategoryFor(province, p.category);
  if (cats.includes(fromProfile)) return fromProfile;
  if (mode === "老高考") return cats.includes("理工") ? "理工" : cats[0];
  if (cats.includes("物理")) return "物理";
  if (cats.includes("综合")) return "综合";
  return cats[0];
}

function buildProvinceSelect() {
  const sel = document.getElementById("hero-province");
  const profileSel = document.getElementById("profile-province");
  const chipContainer = document.getElementById("filter-province");
  const list = provinces();

  const opts = list.map((p) => `<option value="${p}">${p}</option>`).join("");
  if (sel) sel.innerHTML = opts;
  if (profileSel) profileSel.innerHTML = opts;
  if (sel) sel.value = filters.province;
  if (profileSel) profileSel.value = getProfile().province || filters.province;

  if (!chipContainer) return;
  chipContainer.innerHTML = list
    .map(
      (p) =>
        `<button type="button" class="chip${p === filters.province ? " active" : ""}" data-province="${p}">${p}</button>`
    )
    .join("");

  chipContainer.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", async () => {
      filters.province = btn.getAttribute("data-province") || "四川";
      await loadProvince(filters.province);
      syncProvinceUI();
      renderScores();
    });
  });
}

function syncProvinceUI() {
  const sel = document.getElementById("hero-province");
  if (sel) sel.value = filters.province;

  document.querySelectorAll("#filter-province .chip").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-province") === filters.province);
  });

  const years = yearsForProvince(filters.province);
  if (!years.includes(filters.year)) filters.year = years[0] ?? 2024;

  const cats = categoriesFor(filters.province, filters.year);
  if (!cats.includes(filters.category)) filters.category = defaultCategory(filters.province, filters.year);

  const batches = batchesFor(filters.province, filters.year, filters.category);
  if (!batches.includes(filters.batch)) filters.batch = batches[0] ?? "普通类一批";

  buildYearChips();
  buildCategoryChips();
  buildBatchChips();
}

function bindChipGroup(containerId, onPick) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll(".chip:not(.disabled)").forEach((btn) => {
    btn.addEventListener("click", () => onPick(btn));
  });
}

function buildYearChips() {
  const container = document.getElementById("filter-year");
  if (!container) return;
  const years = yearsForProvince(filters.province);
  container.innerHTML = years
    .map(
      (y) =>
        `<button type="button" class="chip${y === filters.year ? " active" : ""}" data-year="${y}">${y}</button>`
    )
    .join("");
  bindChipGroup("filter-year", (btn) => {
    filters.year = Number(btn.getAttribute("data-year"));
    if (!categoriesFor(filters.province, filters.year).includes(filters.category)) {
      filters.category = defaultCategory(filters.province, filters.year);
    }
    syncProvinceUI();
    renderScores();
  });
}

function buildCategoryChips() {
  const container = document.getElementById("filter-category");
  if (!container) return;
  const available = categoriesFor(filters.province, filters.year);
  container.innerHTML = available
    .map(
      (c) =>
        `<button type="button" class="chip${c === filters.category ? " active" : ""}" data-category="${c}">${c}</button>`
    )
    .join("");
  bindChipGroup("filter-category", (btn) => {
    filters.category = btn.getAttribute("data-category") || filters.category;
    syncProvinceUI();
    renderScores();
  });
}

function buildBatchChips() {
  const container = document.getElementById("filter-batch");
  if (!container) return;
  const batches = batchesFor(filters.province, filters.year, filters.category);
  container.innerHTML = batches
    .map(
      (b) =>
        `<button type="button" class="chip${b === filters.batch ? " active" : ""}" data-batch="${b}">${b}</button>`
    )
    .join("");
  bindChipGroup("filter-batch", (btn) => {
    filters.batch = btn.getAttribute("data-batch") || filters.batch;
    renderScores();
    buildBatchChips();
  });
}

function prevYearRecord(current) {
  return allRecords.find(
    (r) =>
      r.province === current.province &&
      r.year === current.year - 1 &&
      r.category === current.category &&
      r.batch === current.batch
  );
}

function renderScores() {
  const list = document.getElementById("score-list");
  if (!list) return;

  const matched = allRecords.filter(
    (r) =>
      r.province === filters.province &&
      r.year === filters.year &&
      r.category === filters.category &&
      r.batch === filters.batch
  );

  if (matched.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>该组合暂无数据。</p>
        <a href="${officialUrl("chsi_score")}" target="_blank" rel="noopener noreferrer">查看阳光高考官方数据</a>
      </div>`;
    return;
  }

  list.innerHTML = matched
    .map((r) => {
      const prev = prevYearRecord(r);
      let deltaHtml = "";
      if (prev && r.min_score != null && prev.min_score != null) {
        const diff = r.min_score - prev.min_score;
        const cls = diff >= 0 ? "up" : "down";
        const arrow = diff >= 0 ? "↑" : "↓";
        deltaHtml = `<span class="score-card__delta ${cls}">较去年 ${arrow} ${Math.abs(diff)} 分</span>`;
      }
      const rankHtml =
        r.min_rank != null
          ? `<div class="score-card__row"><span>最低位次</span><span>${r.min_rank.toLocaleString()}</span></div>`
          : "";
      return `
        <article class="score-card">
          <div class="score-card__meta">${r.province} · ${r.year} · ${r.category}</div>
          <div class="score-card__row">
            <span>省控线</span><span>${r.control_line ?? "—"}</span>
          </div>
          <div class="score-card__row">
            <span>川大最低</span><span class="score-card__score">${r.min_score ?? "—"}</span>
          </div>
          ${rankHtml}
          <div class="score-card__row">
            <span>${r.batch}</span>${deltaHtml}
          </div>
          ${r.note ? `<p class="score-card__note">${r.note}</p>` : ""}
        </article>`;
    })
    .join("");
}

export { provinces as getProvinces };
