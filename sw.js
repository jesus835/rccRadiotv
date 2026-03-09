/* Service Worker - RCC Radio y TV
   Guarda la página localmente en la primera visita para ahorrar ancho de banda */
const CACHE_NAME = 'rcc-radio-tv-v1';

const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'images/logo.png',
  'images/fondo.jpg',
  'icons/icon.svg',
  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/hls.js@1.4.12'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !url.href.includes('fonts.googleapis.com') && !url.href.includes('cdn.jsdelivr.net')) {
    return;
  }
  if (event.request.method !== 'GET') return;
  if (url.pathname.includes('.m3u8') || url.pathname.includes('bozztv.com')) return;

  const cacheKey = (url.pathname === '/' || url.pathname.endsWith('/')) ? new URL('index.html', event.request.url).href : event.request;

  event.respondWith(
    caches.match(cacheKey).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        if (response.ok && response.type === 'basic') {
          const putKey = typeof cacheKey === 'string' ? new Request(cacheKey) : event.request;
          caches.open(CACHE_NAME).then((cache) => cache.put(putKey, clone));
        }
        return response;
      });
    })
  );
});
