// Krishkar Pharma MR Reporting - Service Worker
const CACHE_NAME = 'krishkar-mr-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {
      // Silently fail if pre-caching fails (e.g. offline during install)
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first strategy (always try network, fall back to cache)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http requests (chrome-extension, etc)
  if (!event.request.url.startsWith('http')) return;

  // Skip ICP API calls - always go to network
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('identity.ic0.app')) return;
  if (event.request.url.includes('identity.internetcomputer.org')) return;
  if (event.request.url.includes('icp-api.io')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response && response.status === 200) {
          const responseClone = response.clone();
          const url = event.request.url;
          // Only cache static assets (images, fonts, js, css)
          if (
            url.includes('/assets/') ||
            url.endsWith('.js') ||
            url.endsWith('.css') ||
            url.endsWith('.png') ||
            url.endsWith('.jpg') ||
            url.endsWith('.woff2')
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
