const CACHE = 'cervical-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
];

let reminderTimer = null;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'REMINDER_CONFIG') return;
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
  if (e.data.enabled && e.data.minutes > 0) {
    const ms = e.data.minutes * 60 * 1000;
    reminderTimer = setInterval(() => {
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        const visible = list.some((c) => c.visibilityState === 'visible');
        if (visible) {
          list.forEach((c) => c.postMessage({ type: 'PAUSE_REMINDER' }));
          return;
        }
        self.registration.showNotification('Pausa activa — Cuello', {
          body: '5 chin tucks + hombros atrás + mirar un punto lejano (30 seg)',
          icon: './icon.svg',
          tag: 'cervical-pause',
          vibrate: [100, 50, 100],
          renotify: true,
        });
      });
    }, ms);
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});
