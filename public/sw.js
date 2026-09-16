// Orbix ERP Lightweight Service Worker for PWA Installation & Standalone Execution
const CACHE_NAME = 'orbix-erp-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Always network-first so ERP data, web sockets, and dynamic APIs stay 100% up to date
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

