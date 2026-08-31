/* Poster-Werkstatt — offline verfügbar, aber Updates kommen sofort an. */
const CACHE = "poster-werkstatt-v21";
const FILES = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  /* Cover und iTunes immer live */
  if (url.origin !== location.origin) return;

  const isPage = e.request.mode === "navigate" ||
                 (e.request.destination === "document") ||
                 url.pathname.endsWith(".html") || url.pathname.endsWith("/");

  if (isPage) {
    /* Erst das Netz fragen, damit eine neue Fassung sofort erscheint.
       Ohne Verbindung kommt die gespeicherte Seite. */
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
