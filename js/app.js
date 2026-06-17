import { initScores } from "./scores.js";
import { initMajors, initPolicies, initCampus, initFaq, wireOfficialLinks } from "./majors.js";
import { initSimulator } from "./simulator.js";
import { initProfileUI, syncHeroProvince } from "./profile-ui.js";
import { initPaths } from "./paths.js";
import { initChecklists } from "./checklists.js";
import { initCommunity, initSiteMeta, initPostAdmission } from "./site-meta.js";
import { initRouter } from "./router.js";

const SECTIONS = [
  { id: "section-hero", tab: "首页" },
  { id: "section-profile", tab: "档案" },
  { id: "section-simulator", tab: "模拟" },
  { id: "section-paths", tab: "路径" },
  { id: "section-scores", tab: "分数线" },
  { id: "section-majors", tab: "专业" },
  { id: "section-community", tab: "新生群" },
  { id: "section-contact", tab: "联系" },
];

function buildNav() {
  const targets = [
    document.getElementById("top-nav-inner"),
    document.getElementById("side-nav-inner"),
  ].filter(Boolean);

  const html = SECTIONS.map(
    (s) => `<button type="button" class="nav-tab" data-target="${s.id}">${s.tab}</button>`
  ).join("");

  targets.forEach((el) => {
    el.innerHTML = html;
    el.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.getAttribute("data-target") || "")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  });
}

function initScrollSpy() {
  const tabs = document.querySelectorAll(".nav-tab");
  SECTIONS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tabs.forEach((t) => {
              t.classList.toggle("active", t.getAttribute("data-target") === id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    ).observe(el);
  });
}

function initQuickGrid() {
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    const go = () => {
      const id = el.getAttribute("data-scroll");
      document.getElementById(id || "")?.scrollIntoView({ behavior: "smooth" });
      if (id === "section-services") activateServicePanel("plan");
    };
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });
}

function activateServicePanel(name) {
  document.querySelectorAll(".service-tab").forEach((t) => {
    t.classList.toggle("active", t.getAttribute("data-panel") === name);
  });
  document.querySelectorAll(".service-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${name}`);
  });
}

function initServiceTabs() {
  document.querySelectorAll(".service-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activateServicePanel(tab.getAttribute("data-panel") || "plan");
    });
  });
}

function initFab() {
  const fab = document.getElementById("fab-cta");
  fab?.addEventListener("click", () => {
    document.getElementById("section-contact")?.scrollIntoView({ behavior: "smooth" });
  });
  if (fab) fab.textContent = "联系学长";
}

function initCountdown() {
  const target = new Date("2026-06-07T09:00:00+08:00");
  const el = document.getElementById("gaokao-countdown");
  if (!el) return;

  const tick = () => {
    const now = Date.now();
    const diff = target.getTime() - now;
    if (diff <= 0) {
      el.textContent = "2026 高考进行中，祝各位考生顺利！";
      return;
    }
    const days = Math.ceil(diff / 86400000);
    el.textContent = `距 2026 高考还有 ${days} 天`;
  };
  tick();
  setInterval(tick, 3600000);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

async function populateProfileProvinces() {
  const sel = document.getElementById("profile-province");
  if (!sel || sel.options.length > 1) return;
  try {
    const index = await fetch("data/scores_index.json").then((r) => r.json());
    const list = index.provinces || [];
    sel.innerHTML = list
      .map((p) => `<option value="${p}">${p}</option>`)
      .join("");
  } catch { /* scores.js will fill */ }
}

document.addEventListener("DOMContentLoaded", async () => {
  buildNav();
  initRouter();
  initScrollSpy();
  initQuickGrid();
  initServiceTabs();
  initFab();
  initCountdown();
  registerServiceWorker();

  await populateProfileProvinces();

  await Promise.all([
    wireOfficialLinks(),
    initSiteMeta(),
    initProfileUI(),
    initScores().then(() => syncHeroProvince()),
    initPolicies(),
    initMajors(),
    initCampus(),
    initFaq(),
    initSimulator(),
    initPaths(),
    initChecklists(),
    initCommunity(),
    initPostAdmission(),
  ]);
});
