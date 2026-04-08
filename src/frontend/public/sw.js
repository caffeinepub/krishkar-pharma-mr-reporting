// Krishkar Pharma MR Reporting - Service Worker
const CACHE_NAME = 'krishkar-pwa-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
];

// ICP/Internet Identity domains to always bypass
const ICP_DOMAINS = [
  '.ic0.app',
  '.icp0.io',
  '.internetcomputer.org',
  'identity.ic0.app',
  'raw.ic0.app',
  'icp-api.io',
];

function isIcpUrl(url) {
  return ICP_DOMAINS.some((domain) => url.includes(domain));
}

// Install: pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    }).catch((err) => {
      console.warn('[SW] Pre-cache failed:', err);
      return self.skipWaiting();
    })
  );
});

// Activate: delete old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first for static assets, bypass ICP entirely
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  // Skip all ICP/Internet Identity URLs - let them go directly to network
  if (isIcpUrl(event.request.url)) return;

  // Skip ICP API calls
  if (event.request.url.includes('/api/v2/')) return;
  if (event.request.url.includes('/api/v3/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return from cache, then refresh in background
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {/* network unavailable, cached version already returned */});
        return cached;
      }

      // Not in cache — fetch from network
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Network failed and nothing in cache
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
