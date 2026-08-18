const CACHE_NAME = 'mena-al-manan-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './pwa.css',
  './pwa.js',
  './font/1.ttf',
  './font/MaterialSymbolsRounded.woff2',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './book/1.htm',
  './book/2.htm',
  './book/3.htm',
  './book/4.htm',
  './book/5.htm',
  './fahrst/1.json',
  './fahrst/2.json',
  './fahrst/3.json',
  './fahrst/4.json',
  './fahrst/5.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        const responseForCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseForCache));
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
