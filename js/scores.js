/** @typedef {{ year: number; province: string; category: string; batch: string; control_line: number|null; min_score: number|null; min_rank: number|null; note: string; exam_mode: string }} ScoreRecord */

const CATEGORY_MAP = {
  老高考: ["理工", "文史"],
  新高考: ["物理", "历史"],
};

/** @type {ScoreRecord[]} */
let allRecords = [];

/** @type {{ province: string; year: number; category: string; batch: string }} */
const filters = {
  province: "四川",
  year: 2024,
  category: "理工",
  batch: "普通类一批",
};

const PROVINCE_MODES = {
  四川: "老高考",
  陕西: "老高考",
  云南: "老高考",
  重庆: "新高考",
  贵州: "新高考",
};

export async function initScores() {
  const res = await fetch("data/scores.json");
  const data = await res.json();
  allRecords = data.records;

  const metaEl = document.getElementById("scores-updated");
  if (metaEl && data.meta?.updated) {
    metaEl.textContent = `数据更新：${data.meta.updated} · 来源：${data.meta.source}`;
  }

  buildProvinceSelect();
  buildYearChips();
  buildCategoryChips();
  buildBatchChips();
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
  return [...new Set(allRecords.map((r) => r.province))].sort();
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

function buildProvinceSelect() {
  const sel = document.getElementById("hero-province");
  const chipContainer = document.getElementById("filter-province");
  if (!sel || !chipContainer) return;

  sel.innerHTML = provinces()
    .map((p) => `<option value="${p}"${p === filters.province ? " selected" : ""}>${p}</option>`)
    .join("");

  chipContainer.innerHTML = provinces()
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
  if (!cats.includes(filters.category)) filters.category = cats[0] ?? "理工";

  const batches = batchesFor(filters.province, filters.year, filters.category);
  if (!batches.includes(filters.batch)) filters.batch = batches[0] ?? "普通类一批";

  buildYearChips();
  buildCategoryChips();
  buildBatchChips();
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

  container.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.year = Number(btn.getAttribute("data-year"));
      const cats = categoriesFor(filters.province, filters.year);
      if (!cats.includes(filters.category)) filters.category = cats[0];
      buildCategoryChips();
      buildBatchChips();
      renderScores();
      buildYearChips();
    });
  });
}

function buildCategoryChips() {
  const container = document.getElementById("filter-category");
  if (!container) return;
  const mode = PROVINCE_MODES[filters.province] || "老高考";
  const allCats = CATEGORY_MAP[mode] || ["理工", "文史"];
  const available = categoriesFor(filters.province, filters.year);

  container.innerHTML = allCats
    .map((c) => {
      const disabled = !available.includes(c);
      return `<button type="button" class="chip${c === filters.category ? " active" : ""}${disabled ? " disabled" : ""}" data-category="${c}"${disabled ? " disabled" : ""}>${c}</button>`;
    })
    .join("");

  container.querySelectorAll(".chip:not(.disabled)").forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.category = btn.getAttribute("data-category") || filters.category;
      const batches = batchesFor(filters.province, filters.year, filters.category);
      if (!batches.includes(filters.batch)) filters.batch = batches[0];
      buildBatchChips();
      renderScores();
      buildCategoryChips();
    });
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

  container.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.batch = btn.getAttribute("data-batch") || filters.batch;
      renderScores();
      buildBatchChips();
    });
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
        <p>该组合暂无数据，更多省份陆续更新中。</p>
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
      const rankText =
        r.min_rank != null ? `位次参考：约 ${r.min_rank.toLocaleString()} 名` : "位次请参考省考试院公布";
      return `
        <article class="score-card">
          <div class="score-card__meta">${r.province} · ${r.year} · ${r.category} · ${r.batch}</div>
          <div class="score-card__row">
            <span>省控线</span>
            <span>${r.control_line ?? "—"}</span>
          </div>
          <div class="score-card__row">
            <span>川大最低分</span>
            <span class="score-card__score">${r.min_score ?? "—"}</span>
          </div>
          <div class="score-card__row">
            <span>${rankText}</span>
            ${deltaHtml}
          </div>
          ${r.note ? `<p class="score-card__note">${r.note}</p>` : ""}
        </article>`;
    })
    .join("");
}

export function setProvinceFromHero(province) {
  if (!province) return;
  filters.province = province;
  syncProvinceUI();
  renderScores();
}
