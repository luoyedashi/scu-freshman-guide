/**
 * Fetch JSON with retry and uniform error handling.
 * @param {string} url
 * @param {{ retries?: number }} opts
 */
export async function fetchJson(url, opts = {}) {
  const retries = opts.retries ?? 2;
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * @param {HTMLElement} el
 * @param {string} message
 * @param {() => void} [onRetry]
 */
export function renderFetchError(el, message, onRetry) {
  if (!el) return;
  el.innerHTML = `
    <div class="empty-state empty-state--error">
      <p>${message}</p>
      ${onRetry ? `<button type="button" class="btn-outline btn-retry">重试</button>` : ""}
    </div>`;
  el.querySelector(".btn-retry")?.addEventListener("click", onRetry);
}
