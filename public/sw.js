// Awaaz AI Service Worker - Pass-through & Cache Cleanser
const CACHE_NAME = 'awaaz-ai-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// Pass all network requests directly to network so dynamic Vite & dev assets load smoothly
self.addEventListener('fetch', (event) => {
  // Let browser fetch normally without trapping responses
  return;
});

