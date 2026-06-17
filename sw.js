const CACHE = "junxian-guide-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./legal.html",
  "./css/tokens.css",
  "./css/main.css",
  "./js/app.js",
  "./js/profile.js",
  "./js/profile-ui.js",
  "./js/scores.js",
  "./js/simulator.js",
  "./js/links.js",
  "./js/fetchUtil.js",
  "./js/router.js",
  "./data/scores_index.json",
  "./data/sim_sichuan.json",
  "./data/site.json",
  "./data/scores/四川.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
