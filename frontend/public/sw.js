// Service Worker for Voicebox Anonymous
// Version: 1.2 - BFCache Optimized
const CACHE_NAME = 'voicebox-anonymous-cache-v1.2';

// Only cache essential static assets
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Skip caching for these paths (API routes, etc.)
const IGNORE_PATHS = [
  '/api/',
  '/socket.io/',
  '/sockjs-node/'
];

// Install event - cache the application shell
self.addEventListener('install', event => {
  // Don't skip waiting here to prevent potential bfcache issues
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] Opened cache');
        
        // Cache core assets one by one with better error handling
        for (const url of CORE_ASSETS) {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
            console.log(`[Service Worker] Cached: ${url}`);
          } catch (err) {
            console.warn(`[Service Worker] Failed to cache ${url}:`, err);
          }
        }
      } catch (error) {
        console.error('[Service Worker] Installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Check if a request should be handled by the service worker
function shouldHandleRequest(request) {
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (!url.origin.startsWith(self.location.origin)) {
    return false;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return false;
  }
  
  // Skip ignored paths
  if (IGNORE_PATHS.some(path => url.pathname.startsWith(path))) {
    return false;
  }
  
  return true;
}

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', event => {
  // Skip requests we shouldn't handle
  if (!shouldHandleRequest(event.request)) {
    return;
  }
  
  // For navigation requests, use a more bfcache-friendly approach
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first for navigation requests
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('[Service Worker] Network fetch failed, falling back to cache');
        }
        
        // Fall back to cache if network fails
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' });
      })()
    );
  } else {
    // For non-navigation requests, use cache-first strategy
    event.respondWith(
      (async () => {
        try {
          // Try cache first
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, try network
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('[Service Worker] Fetch failed:', error);
          return new Response('Network error', { status: 500 });
        }
      })()
    );
  }
});

// Message event - handle messages from the page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
