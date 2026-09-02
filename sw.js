const CACHE_NAME = "my-app-cache-v1";

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "images/game-over.jpg",
  "images/booking-duel.jpg",
  "images/room-mismatch.jpg",
  "images/missing-save.jpg",
  "images/final-boss.jpg",
  "audio/theme.mp3"
];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});