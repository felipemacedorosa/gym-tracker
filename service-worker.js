// Cache name — bump the version string to force an update on all clients
const CACHE = 'gym-tracker-v2';

// All files that make up the app shell
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './storage.js',
  './calculations.js',
  './workoutService.js',
  './exerciseLibrary.js',
  './render.js',
  './formHelpers.js',
  './modals.js',
  './progress.js',
  './app.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

// Pre-cache all app shell files on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Remove old caches on activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first: serve from cache, fall back to network and cache the response
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Only cache valid same-origin responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
