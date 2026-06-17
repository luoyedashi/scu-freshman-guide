import { loadLinks, resolveUrl } from "./links.js";

let colleges = [];
let allTags = [];
let showAllMajors = false;

export async function initMajors() {
  await loadLinks();
  const res = await fetch("data/majors.json");
  const data = await res.json();
  colleges = data.colleges;
  allTags = data.tags || [];

  renderTags();
  renderColleges();

  const search = document.getElementById("major-search");
  search?.addEventListener("input", () => renderColleges(search.value.trim(), activeTag));

  document.getElementById("majors-expand")?.addEventListener("click", () => {
    showAllMajors = true;
    renderColleges(search?.value.trim() || "", activeTag);
    document.getElementById("majors-expand")?.classList.add("hidden");
  });
}

let activeTag = "";

function renderTags() {
  const container = document.getElementById("major-tags");
  if (!container) return;
  container.innerHTML = `<button type="button" class="major-tag active" data-tag="">热门</button>${allTags
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
  const inc = (major.includes || []).join(" ");
  const text = `${major.name} ${major.brief || ""} ${inc} ${major.subjects || ""} ${(major.tags || []).join(" ")}`.toLowerCase();
  if (query && !text.includes(query.toLowerCase())) return false;
  if (tag && !(major.tags || []).includes(tag)) return false;
  if (!showAllMajors && !query && !tag && !major.featured) return false;
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
    container.innerHTML = `<div class="empty-state"><p>未找到匹配专业。</p></div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (col, i) => `
    <div class="college-group${i < 3 ? " open" : ""}">
      <div class="college-group__header" role="button" tabindex="0">${col.name}<span class="college-group__count">${col.majors.length}</span></div>
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

function renderMajorCard(major) {
  const featured = major.featured ? " major-card--featured" : "";
  const url = resolveUrl(major.urlKey || major.url);
  const includes = major.includes?.length
    ? `<p class="major-card__detail">分流专业：${major.includes.join("、")}</p>`
    : "";
  const subjects = major.subjects
    ? `<p class="major-card__detail">选科：${major.subjects}</p>`
    : "";
  const campus = major.campus ? `<p class="major-card__detail">就读：${major.campus}校区</p>` : "";

  if (!major.featured && !major.brief && !major.includes?.length) {
    return `
      <a class="major-card major-card--compact" href="${url}" target="_blank" rel="noopener">
        <span class="major-card__name">${major.name}</span>
        <span class="major-card__arrow">→</span>
      </a>`;
  }

  return `
    <article class="major-card${featured}">
      <h4 class="major-card__name">${major.name}</h4>
      ${major.brief ? `<p class="major-card__brief">${major.brief}</p>` : ""}
      ${subjects}${includes}${campus}
      <a class="major-card__link" href="${url}" target="_blank" rel="noopener">查看招生计划 →</a>
    </article>`;
}

export async function initPolicies() {
  await loadLinks();
  const res = await fetch("data/policies.json");
  const data = await res.json();
  const list = document.getElementById("policy-list");
  const search = document.getElementById("policy-search");
  if (!list) return;

  const render = (query = "", featuredOnly = true) => {
    const q = query.toLowerCase();
    let items = data.policies.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
    if (featuredOnly && !q) items = items.filter((p) => p.featured);

    const grouped = items.reduce((acc, p) => {
      (acc[p.category] ||= []).push(p);
      return acc;
    }, {});

    list.innerHTML = Object.entries(grouped)
      .map(
        ([cat, policies]) => `
      <div class="policy-group">
        <h3 class="policy-group__title">${cat}</h3>
        ${policies
          .map((p) => {
            const href = resolveUrl(p.urlKey || p.url);
            return `
          <a class="policy-card policy-card--link" href="${href}" target="_blank" rel="noopener noreferrer">
            <div class="policy-card__body">
              <span class="policy-card__year">${p.year}</span>
              <span class="policy-card__title">${p.title}</span>
              <p class="policy-card__summary">${p.summary}</p>
            </div>
            <span class="policy-card__arrow">→</span>
          </a>`;
          })
          .join("")}
      </div>`
      )
      .join("");

    if (!featuredOnly || q) {
      document.getElementById("policies-more")?.classList.add("hidden");
    }
  };

  render();
  search?.addEventListener("input", () => render(search.value.trim(), !search.value.trim()));

  document.getElementById("policies-more")?.addEventListener("click", () => {
    render(search?.value.trim() || "", false);
  });
}

export async function initCampus() {
  const res = await fetch("data/campus.json");
  const data = await res.json();
  const map = document.getElementById("campus-map");
  const detail = document.getElementById("campus-detail");
  if (!map || !detail) return;

  map.innerHTML = `
    <svg viewBox="0 0 100 80" class="campus-map__svg" aria-label="江安校区示意地图">
      <rect x="5" y="10" width="90" height="65" rx="4" fill="#f5ead8" stroke="#c9a063"/>
      <text x="50" y="8" text-anchor="middle" font-size="4" fill="#8e181c">江安校区示意</text>
      ${data.pois
        .map(
          (p) =>
            `<circle class="campus-poi" data-id="${p.id}" cx="${p.x}" cy="${p.y}" r="3.5" fill="#b01f24" tabindex="0"/>
             <text x="${p.x}" y="${p.y - 5}" text-anchor="middle" font-size="3" fill="#666">${p.name}</text>`
        )
        .join("")}
    </svg>`;

  const showPoi = (poi) => {
    detail.innerHTML = `<strong>${poi.name}</strong><p>${poi.desc}</p>`;
  };

  data.pois.forEach((poi) => {
    map.querySelector(`[data-id="${poi.id}"]`)?.addEventListener("click", () => showPoi(poi));
  });
  if (data.pois[0]) showPoi(data.pois[0]);

  const note = document.getElementById("campus-feasibility");
  if (note && data.feasibility) note.textContent = data.feasibility.summary;
}

export async function initFaq() {
  await loadLinks();
  const chsi = resolveUrl("chsi_charter");
  const items = [
    {
      q: "2026年川大招生章程在哪看？",
      a: `请通过<a href="${chsi}" target="_blank" rel="noopener">阳光高考招生章程</a>或本站政策区进入，以教育部备案版本为准。`,
    },
    {
      q: "川大还是大类招生吗？",
      a: "2026年仍以大类招生为主；工科大类培养一年后可任选大类内专业。新增7个本科专业详见专业区。",
    },
    {
      q: "多少分/位次能上川大？",
      a: "请使用本站「志愿模拟」输入<strong>全省位次</strong>，对照川大及省内其他重点院校近年最低位次；分数区数据可在「分数线」模块查看。",
    },
    {
      q: "高校专项2026怎么报？",
      a: "2026年高校专项不提前报名、不单独发简章，须达省特控线，详见招生章程第二十四条。",
    },
    {
      q: "如何联系俊贤学长？",
      a: "页面底部扫码添加微信「落叶大师」，备注省份+分数或家教需求。",
    },
  ];

  const container = document.getElementById("faq-list");
  if (!container) return;

  container.innerHTML = items
    .map(
      (item, i) => `
    <details class="faq-item"${i === 0 ? " open" : ""}>
      <summary>${item.q}</summary>
      <p>${item.a}</p>
    </details>`
    )
    .join("");
}

export async function wireOfficialLinks() {
  await loadLinks();
  document.querySelectorAll("[data-link-key]").forEach((el) => {
    const key = el.getAttribute("data-link-key");
    if (key && el instanceof HTMLAnchorElement) el.href = resolveUrl(key);
  });
}
