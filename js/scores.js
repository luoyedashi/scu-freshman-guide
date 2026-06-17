/** @typedef {{ year: number; province: string; category: string; batch: string; control_line: number|null; min_score: number|null; min_rank: number|null; note: string; exam_mode: string }} ScoreRecord */

let allRecords = [];

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
  const res = await fetch("data/scores.json");
  const data = await res.json();
  allRecords = data.records;

  const metaEl = document.getElementById("scores-updated");
  if (metaEl && data.meta) {
    const n = data.meta.provinces_covered?.length ?? 0;
    metaEl.textContent = `数据更新：${data.meta.updated} · 覆盖 ${n} 省 · 来源：川大招生网`;
  }

  buildProvinceSelect();
  syncProvinceUI();
  renderScores();

  document.getElementById("province-go")?.addEventListener("click", () => {
    const sel = /** @type {HTMLSelectElement} */ (document.getElementById("hero-province"));
    if (sel?.value) {
      filters.province = sel.value;
      syncProvinceUI();
      document.getElementById("section-scores")?.scrollIntoView({ behavior: "smooth" });
      renderScores();
    }
  });
}

function provinces() {
  return [...new Set(allRecords.map((r) => r.province))].sort((a, b) => {
    if (a === "四川") return -1;
    if (b === "四川") return 1;
    return a.localeCompare(b, "zh-CN");
  });
}

function yearsForProvince(province) {
  return [...new Set(allRecords.filter((r) => r.province === province).map((r) => r.year))].sort(
    (a, b) => b - a
  );
}

function categoriesFor(province, year) {
  return [
    ...new Set(
      allRecords.filter((r) => r.province === province && r.year === year).map((r) => r.category)
    ),
  ];
}

function batchesFor(province, year, category) {
  return [
    ...new Set(
      allRecords
        .filter((r) => r.province === province && r.year === year && r.category === category)
        .map((r) => r.batch)
    ),
  ];
}

function defaultCategory(province, year) {
  const cats = categoriesFor(province, year);
  const mode = PROVINCE_MODES[province] || "老高考";
  if (mode === "老高考") {
    return cats.includes("理工") ? "理工" : cats[0];
  }
  if (cats.includes("物理")) return "物理";
  if (cats.includes("综合")) return "综合";
  return cats[0];
}

function buildProvinceSelect() {
  const sel = document.getElementById("hero-province");
  const chipContainer = document.getElementById("filter-province");
  if (!sel || !chipContainer) return;

  const list = provinces();
  sel.innerHTML = list
    .map((p) => `<option value="${p}"${p === filters.province ? " selected" : ""}>${p}</option>`)
    .join("");

  chipContainer.innerHTML = list
    .map(
      (p) =>
        `<button type="button" class="chip${p === filters.province ? " active" : ""}" data-province="${p}">${p}</button>`
    )
    .join("");

  chipContainer.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.province = btn.getAttribute("data-province") || "四川";
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
    const cats = categoriesFor(filters.province, filters.year);
    if (!cats.includes(filters.category)) filters.category = defaultCategory(filters.province, filters.year);
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
        <a href="https://zs.scu.edu.cn/zsxx/lqfs/" target="_blank" rel="noopener">查看官方分数线</a>
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
      return `
        <article class="score-card">
          <div class="score-card__meta">${r.province} · ${r.year} · ${r.category}</div>
          <div class="score-card__row">
            <span>省控线</span><span>${r.control_line ?? "—"}</span>
          </div>
          <div class="score-card__row">
            <span>川大最低</span><span class="score-card__score">${r.min_score ?? "—"}</span>
          </div>
          <div class="score-card__row">
            <span>${r.batch}</span>${deltaHtml}
          </div>
          ${r.note ? `<p class="score-card__note">${r.note}</p>` : ""}
        </article>`;
    })
    .join("");
}
