import { fetchJson, renderFetchError } from "./fetchUtil.js";
import { resolveUrl } from "./links.js";

export async function initPaths() {
  const list = document.getElementById("paths-list");
  if (!list) return;
  try {
    const data = await fetchJson("data/admission_paths.json");
    list.innerHTML = data.paths
      .map(
        (p) => `
      <details class="path-card">
        <summary class="path-card__title">${p.title}</summary>
        <div class="path-card__body">
          <p>${p.summary}</p>
          ${p.fit?.length ? `<p><strong>适合：</strong>${p.fit.join("；")}</p>` : ""}
          ${p.cautions?.length ? `<p class="path-card__warn"><strong>注意：</strong>${p.cautions.join("；")}</p>` : ""}
          <a class="path-card__link" href="${resolveUrl(p.urlKey)}" target="_blank" rel="noopener noreferrer">查看官方说明 →</a>
        </div>
      </details>`
      )
      .join("");
  } catch {
    renderFetchError(list, "进校路径加载失败", () => initPaths());
  }
}
