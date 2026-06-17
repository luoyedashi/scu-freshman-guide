import { initScores } from "./scores.js";
import { initMajors, initPolicies, initCampus, initFaq, wireOfficialLinks } from "./majors.js";
import { initSimulator } from "./simulator.js";

const SECTIONS = [
  { id: "section-hero", tab: "首页" },
  { id: "section-guide", tab: "26届" },
  { id: "section-simulator", tab: "模拟" },
  { id: "section-scores", tab: "分数线" },
  { id: "section-policies", tab: "政策" },
  { id: "section-majors", tab: "专业" },
  { id: "section-campus", tab: "江安" },
  { id: "section-services", tab: "服务" },
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
  document.getElementById("fab-cta")?.addEventListener("click", () => {
    document.getElementById("section-contact")?.scrollIntoView({ behavior: "smooth" });
  });
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

document.addEventListener("DOMContentLoaded", async () => {
  buildNav();
  initScrollSpy();
  initQuickGrid();
  initServiceTabs();
  initFab();
  initCountdown();

  await Promise.all([
    wireOfficialLinks(),
    initScores(),
    initPolicies(),
    initMajors(),
    initCampus(),
    initFaq(),
    initSimulator(),
  ]);
});
