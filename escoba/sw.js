const CACHE = 'escoba-v71';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/engine.js',
  './js/net.js',
  './js/cards-ui.js',
  './js/anim.js',
  './manifest.webmanifest',
  './icon.svg',
  './apple-touch-icon.png',
  './icon-512.png',
  './cards/back.png',
  './cards/oros-1.png',
  './cards/oros-2.png',
  './cards/oros-3.png',
  './cards/oros-4.png',
  './cards/oros-5.png',
  './cards/oros-6.png',
  './cards/oros-7.png',
  './cards/oros-10.png',
  './cards/oros-11.png',
  './cards/oros-12.png',
  './cards/copas-1.png',
  './cards/copas-2.png',
  './cards/copas-3.png',
  './cards/copas-4.png',
  './cards/copas-5.png',
  './cards/copas-6.png',
  './cards/copas-7.png',
  './cards/copas-10.png',
  './cards/copas-11.png',
  './cards/copas-12.png',
  './cards/espadas-1.png',
  './cards/espadas-2.png',
  './cards/espadas-3.png',
  './cards/espadas-4.png',
  './cards/espadas-5.png',
  './cards/espadas-6.png',
  './cards/espadas-7.png',
  './cards/espadas-10.png',
  './cards/espadas-11.png',
  './cards/espadas-12.png',
  './cards/bastos-1.png',
  './cards/bastos-2.png',
  './cards/bastos-3.png',
  './cards/bastos-4.png',
  './cards/bastos-5.png',
  './cards/bastos-6.png',
  './cards/bastos-7.png',
  './cards/bastos-10.png',
  './cards/bastos-11.png',
  './cards/bastos-12.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for JS/CSS so updates land immediately
  if (/\.(js|css)$/.test(url.pathname) || url.pathname.endsWith('/escoba/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
