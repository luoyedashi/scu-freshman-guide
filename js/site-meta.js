import { fetchJson } from "./fetchUtil.js";

export async function initCommunity() {
  const expireEl = document.getElementById("community-expire");
  const qrImg = document.getElementById("community-qr-img");
  if (!expireEl) return;

  try {
    const site = await fetchJson("data/site.json");
    const { groupName, qrExpires, qrImage } = site.community || {};
    if (qrImg && qrImage) qrImg.src = qrImage;

    const expires = qrExpires ? new Date(`${qrExpires}T23:59:59+08:00`) : null;
    const now = new Date();
    if (expires && now > expires) {
      expireEl.innerHTML = `<span class="community-card__expire community-card__expire--warn">群二维码已过期，请联系学长获取新二维码</span>`;
      qrImg?.classList.add("qr-frame--expired");
    } else if (expires) {
      const days = Math.ceil((expires.getTime() - now.getTime()) / 86400000);
      expireEl.textContent = `${groupName || "新生群"} · 二维码有效期至 ${qrExpires}（约 ${days} 天）`;
    }
  } catch {
    expireEl.textContent = "群二维码 7 天内有效，过期请联系学长更新";
  }
}

export async function initSiteMeta() {
  const el = document.getElementById("data-trust-panel");
  if (!el) return;
  try {
    const site = await fetchJson("data/site.json");
    el.innerHTML = site.dataSources
      .map(
        (d) =>
          `<div class="trust-row"><span class="trust-row__label">${d.label}</span><span class="trust-row__meta">${d.source} · 更新 ${d.updated}</span></div>`
      )
      .join("");
  } catch {
    el.innerHTML = `<p class="trust-row__meta">数据来源见各模块说明</p>`;
  }
}

export async function initPostAdmission() {
  const el = document.getElementById("post-admission");
  if (!el) return;
  try {
    const data = await fetchJson("data/post_admission.json");
    const timeline = data.milestones
      .map(
        (m) =>
          `<div class="timeline__item timeline__item--static"><span class="timeline__when">${m.when}</span><span class="timeline__what">${m.what}<small>${m.detail}</small></span></div>`
      )
      .join("");
    const tips = data.tips.map((t) => `<li>${t}</li>`).join("");
    el.innerHTML = `${timeline}<ul class="service-list">${tips}</ul>`;
  } catch { /* optional */ }
}
