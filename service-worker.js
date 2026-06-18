/**
 * TravelMate — service-worker.js
 * Minimal service worker: caches core app shell files so the site
 * loads instantly on repeat visits and works briefly offline.
 * (Live map tiles / routing still need internet, since they come
 * from external services like OpenStreetMap & OSRM.)
 */

const CACHE_NAME = 'travelmate-cache-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
];

/* Install — pre-cache the app shell */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activate — clean up old cache versions */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch — cache-first for app shell files, network-first for everything else
   (map tiles, geocoding, routing all need live network and should not be
   force-served from a stale cache) */
self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  // Only handle GET requests for same-origin app shell files
  var isAppShell = CORE_ASSETS.some(function (asset) {
    return url.indexOf(asset.replace('./', '')) !== -1;
  });

  if (event.request.method === 'GET' && isAppShell) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        return cached || fetch(event.request);
      })
    );
  }
  // All other requests (OSM tiles, Nominatim, OSRM, fonts, icons CDN)
  // pass through to the network normally — no interception.
});
