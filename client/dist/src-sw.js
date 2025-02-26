// This is a minimal service worker for the Mini Index PWA

const isDevelopment = process.env.NODE_ENV === "development";

if (isDevelopment) {
  console.log("Service worker disabled in development mode");
  self.addEventListener("install", (event) => {
    self.skipWaiting(); // Still activate, but don’t cache anything
  });
  self.addEventListener("fetch", (event) => {
    // Bypass caching and serve directly from network in development
    event.respondWith(fetch(event.request));
  });
  self.addEventListener("activate", (event) => {
    // Do nothing or skip claiming clients
  });
  return; // Exit early if in development
}

// Production service worker code
const CACHE_NAME = "mini-index-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/main.bundle.js",
  "/app.bundle.js",
  "/install.bundle.js",
];

// Install event: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients as soon as it activates
  self.clients.claim();
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response from the cached version
      if (response) {
        return response;
      }

      // Not in cache - return the result from the live server
      // and cache it for future
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response since we need to use it in two places
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Do not cache API responses or non-GET requests
          if (
            event.request.method === "GET" &&
            !event.request.url.includes("/api/")
          ) {
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      });
    })
  );
});
