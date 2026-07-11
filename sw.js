const CACHE = 'cervical-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
];

let reminderTimer = null;
let morningTimer = null;

function scheduleMorning(cfg) {
  if (morningTimer) {
    clearTimeout(morningTimer);
    morningTimer = null;
  }
  if (!cfg.enabled) return;
  const hour = cfg.hour ?? 8;
  const minute = cfg.minute ?? 0;
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  morningTimer = setTimeout(() => {
    self.registration.showNotification('Rutina de cuello — Cuello', {
      body: '¿Cómo está el cuello hoy? Registra el dolor y haz los ejercicios de tu fase.',
      icon: './icon.svg',
      tag: 'cervical-morning',
      vibrate: [80, 40, 80],
    });
    scheduleMorning(cfg);
  }, next - now);
}

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
  if (!e.data) return;
  if (e.data.type === 'MORNING_CONFIG') {
    scheduleMorning(e.data);
    return;
  }
  if (e.data.type !== 'REMINDER_CONFIG') return;
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
