import { fetchJson, renderFetchError } from "./fetchUtil.js";
import { resolveUrl } from "./links.js";

export async function initChecklists() {
  const root = document.getElementById("checklists-root");
  if (!root) return;
  try {
    const data = await fetchJson("data/checklists.json");
    root.innerHTML = data.checklists
      .map(
        (cl) => `
      <div class="checklist" data-id="${cl.id}">
        <h3 class="checklist__title">${cl.title}</h3>
        <ul class="checklist__items">
          ${cl.items
            .map(
              (item, i) => `
            <li>
              <label>
                <input type="checkbox" data-checklist="${cl.id}" data-idx="${i}">
                <span>${item.text}${item.required ? ' <em class="checklist__req">必看</em>' : ""}</span>
              </label>
            </li>`
            )
            .join("")}
        </ul>
        <p class="checklist__progress" id="progress-${cl.id}">已勾选 0 / ${cl.items.length}</p>
        <a class="path-card__link" href="${resolveUrl(cl.urlKey)}" target="_blank" rel="noopener noreferrer">官方简章 →</a>
      </div>`
      )
      .join("");

    root.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.getAttribute("data-checklist");
        if (id) updateProgress(id, data.checklists);
      });
    });

    data.checklists.forEach((cl) => restoreChecks(cl.id, cl.items.length));
  } catch {
    renderFetchError(root, "清单加载失败", () => initChecklists());
  }
}

function storageKey(id) {
  return `junxian_check_${id}`;
}

function restoreChecks(id, total) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(id)) || "[]");
    document.querySelectorAll(`input[data-checklist="${id}"]`).forEach((cb, i) => {
      cb.checked = saved.includes(i);
    });
    const prog = document.getElementById(`progress-${id}`);
    if (prog) prog.textContent = `已勾选 ${saved.length} / ${total}`;
  } catch { /* ignore */ }
}

function updateProgress(id, lists) {
  const boxes = [...document.querySelectorAll(`input[data-checklist="${id}"]`)];
  const checked = boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0);
  localStorage.setItem(storageKey(id), JSON.stringify(checked));
  const cl = lists.find((c) => c.id === id);
  const prog = document.getElementById(`progress-${id}`);
  if (prog && cl) prog.textContent = `已勾选 ${checked.length} / ${cl.items.length}`;
}
