let colleges = [];
let allTags = [];
let showAllMajors = false;

export async function initMajors() {
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
  const text = `${major.name} ${major.brief || ""} ${(major.tags || []).join(" ")}`.toLowerCase();
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
    <div class="college-group${i < 3 ? " open" : ""}" data-college="${col.name}">
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
  const linkOnly = !major.featured;
  if (linkOnly) {
    return `
      <a class="major-card major-card--compact" href="${major.url}" target="_blank" rel="noopener">
        <span class="major-card__name">${major.name}</span>
        <span class="major-card__arrow">→</span>
      </a>`;
  }
  return `
    <article class="major-card${featured}">
      <h4 class="major-card__name">${major.name}</h4>
      <p class="major-card__brief">${major.brief || ""}</p>
      ${major.career ? `<p class="major-card__detail">去向：${major.career}</p>` : ""}
      <a class="major-card__link" href="${major.url}" target="_blank" rel="noopener">学院官网 →</a>
    </article>`;
}

export async function initPolicies() {
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
          .map(
            (p) => `
          <a class="policy-card policy-card--link" href="${p.url}" target="_blank" rel="noopener">
            <span class="policy-card__year">${p.year}</span>
            <span class="policy-card__title">${p.title}</span>
            <span class="policy-card__arrow">→</span>
          </a>`
          )
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
  if (note && data.feasibility) {
    note.textContent = data.feasibility.summary;
  }
}

export async function initFaq() {
  const items = [
    {
      q: "2026年川大招生章程在哪看？",
      a: "四川大学本科招生网 zs.scu.edu.cn 已发布2026年章程，本站政策区可一键跳转。",
    },
    {
      q: "多少分能上川大？",
      a: "各省差异大，请在本站分数线区选省份查看2022–2024参考线，并结合位次判断。",
    },
    {
      q: "大一在哪个校区？",
      a: "多数理工科、文科新生在江安校区就读，医学等有特殊安排，以录取通知为准。",
    },
    {
      q: "高校专项和国家专项有什么区别？",
      a: "国家专项面向农村脱贫地区定向招生；高校专项由川大组织，2026年不提前报名，须达省特控线。",
    },
    {
      q: "如何联系俊贤学长咨询？",
      a: "扫码添加微信，备注「省份+分数」或「家教+年级+科目」。",
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
