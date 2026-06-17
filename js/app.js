import { initScores } from "./scores.js";
import { initMajors, initPolicies } from "./majors.js";

const SECTIONS = [
  { id: "section-hero", tab: "首页" },
  { id: "section-scores", tab: "分数线" },
  { id: "section-policies", tab: "政策" },
  { id: "section-majors", tab: "专业" },
  { id: "section-services", tab: "服务" },
];

function buildNav() {
  const inner = document.getElementById("top-nav-inner");
  if (!inner) return;

  inner.innerHTML = SECTIONS.map(
    (s, i) =>
      `<button type="button" class="nav-tab${i === 0 ? " active" : ""}" data-target="${s.id}">${s.tab}</button>`
  ).join("");

  inner.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.getAttribute("data-target") || "");
      target?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function initScrollSpy() {
  const tabs = document.querySelectorAll(".nav-tab");
  const observers = new Map();

  SECTIONS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tabs.forEach((t) => {
              t.classList.toggle("active", t.getAttribute("data-target") === id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    obs.observe(el);
    observers.set(id, obs);
  });
}

function initQuickGrid() {
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-scroll");
      document.getElementById(id || "")?.scrollIntoView({ behavior: "smooth" });
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
  document.getElementById("fab-cta")?.addEventListener("click", () => {
    document.getElementById("section-services")?.scrollIntoView({ behavior: "smooth" });
    activateServicePanel("plan");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  buildNav();
  initScrollSpy();
  initQuickGrid();
  initServiceTabs();
  initFab();

  await Promise.all([initScores(), initPolicies(), initMajors()]);
});
