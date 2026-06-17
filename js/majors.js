/** @typedef {{ name: string; degree: string; duration: string; tags: string[]; featured: boolean; brief?: string; courses?: string[]; career?: string; url: string }} Major */

let colleges = [];
let allTags = [];

export async function initMajors() {
  const res = await fetch("data/majors.json");
  const data = await res.json();
  colleges = data.colleges;
  allTags = data.tags || [];

  renderTags();
  renderColleges();

  const search = document.getElementById("major-search");
  search?.addEventListener("input", () => renderColleges(search.value.trim(), activeTag));
}

let activeTag = "";

function renderTags() {
  const container = document.getElementById("major-tags");
  if (!container) return;
  container.innerHTML = `<button type="button" class="major-tag active" data-tag="">全部</button>${allTags
    .map((t) => `<button type="button" class="major-tag" data-tag="${t}">${t}</button>`)
    .join("")}`;

  container.querySelectorAll(".major-tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTag = btn.getAttribute("data-tag") || "";
      container.querySelectorAll(".major-tag").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const search = document.getElementById("major-search");
      renderColleges(search?.value.trim() || "", activeTag);
    });
  });
}

function majorMatches(major, query, tag) {
  const text = `${major.name} ${major.brief || ""} ${(major.tags || []).join(" ")}`.toLowerCase();
  if (query && !text.includes(query.toLowerCase())) return false;
  if (tag && !(major.tags || []).includes(tag)) return false;
  return true;
}

function renderColleges(query = "", tag = "") {
  const container = document.getElementById("college-list");
  if (!container) return;

  const filtered = colleges
    .map((col) => ({
      ...col,
      majors: col.majors.filter((m) => majorMatches(m, query, tag)),
    }))
    .filter((col) => col.majors.length > 0);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>未找到匹配专业，试试其他关键词。</p></div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (col, i) => `
    <div class="college-group${i === 0 ? " open" : ""}" data-college="${col.name}">
      <div class="college-group__header" role="button" tabindex="0">${col.name}（${col.majors.length}）</div>
      <div class="college-group__body">
        ${col.majors.map(renderMajorCard).join("")}
      </div>
    </div>`
    )
    .join("");

  container.querySelectorAll(".college-group__header").forEach((header) => {
    const toggle = () => header.parentElement?.classList.toggle("open");
    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
}

/** @param {Major} major */
function renderMajorCard(major) {
  const featured = major.featured ? " major-card--featured" : "";
  const courses = major.courses?.length
    ? `<p class="major-card__detail">核心课程：${major.courses.join("、")}</p>`
    : "";
  const career = major.career ? `<p class="major-card__detail">去向：${major.career}</p>` : "";
  const badge = major.featured ? " · 深度介绍" : "";
  return `
    <article class="major-card${featured}">
      <h4 class="major-card__name">${major.name}${badge}</h4>
      <p class="major-card__brief">${major.brief || major.degree + " · " + major.duration}</p>
      ${courses}
      ${career}
      <a class="major-card__link" href="${major.url}" target="_blank" rel="noopener">查看学院官网 →</a>
    </article>`;
}

export async function initPolicies() {
  const res = await fetch("data/policies.json");
  const data = await res.json();
  const list = document.getElementById("policy-list");
  const search = document.getElementById("policy-search");
  if (!list) return;

  const render = (query = "") => {
    const q = query.toLowerCase();
    const items = data.policies.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
    list.innerHTML = items
      .map(
        (p) => `
      <article class="policy-card">
        <div class="policy-card__cat">${p.category} · ${p.year}</div>
        <h3 class="policy-card__title">${p.title}</h3>
        <p class="policy-card__summary">${p.summary}</p>
        <a class="policy-card__link" href="${p.url}" target="_blank" rel="noopener">查看原文 →</a>
      </article>`
      )
      .join("");
  };

  render();
  search?.addEventListener("input", () => render(search.value.trim()));
}
